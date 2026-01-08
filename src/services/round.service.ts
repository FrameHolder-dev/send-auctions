import mongoose from 'mongoose';
import { auctionService } from './auction.service.js';
import { bidService } from './bid.service.js';
import { userService } from './user.service.js';
import { IAuction, IBid } from '../models/index.js';

export class RoundService {
  async placeBid(auctionId: string, userId: string, amount: number): Promise<IBid> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const auction = await auctionService.findById(auctionId);
      if (!auction) throw new Error('Auction not found');
      if (auction.status !== 'active') throw new Error('Auction is not active');
      if (amount < auction.minBid) throw new Error(`Minimum bid is ${auction.minBid}`);

      const existingBid = await bidService.findUserActiveBid(auctionId, userId);
      let bid: IBid;

      if (existingBid) {
        if (amount <= existingBid.amount) {
          throw new Error('New bid must be higher than current bid');
        }
        const diff = amount - existingBid.amount;
        const frozen = await userService.freezeBalance(userId, diff, session);
        if (!frozen) throw new Error('Insufficient balance');
        
        bid = (await bidService.updateBidAmount(existingBid._id.toString(), amount, session))!;
      } else {
        const frozen = await userService.freezeBalance(userId, amount, session);
        if (!frozen) throw new Error('Insufficient balance');

        bid = await bidService.create({
          auctionId: new mongoose.Types.ObjectId(auctionId),
          userId: new mongoose.Types.ObjectId(userId),
          amount,
          round: auction.currentRound,
          status: 'active'
        }, session);
      }

      await this.checkAntiSniping(auction);
      await session.commitTransaction();
      return bid;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async checkAntiSniping(auction: IAuction): Promise<void> {
    const now = new Date();
    const timeLeft = auction.roundEndsAt.getTime() - now.getTime();
    const antiSnipingMs = auction.antiSnipingSeconds * 1000;

    if (timeLeft < antiSnipingMs && timeLeft > 0) {
      const newEndTime = new Date(now.getTime() + antiSnipingMs);
      await auctionService.extendRound(auction._id.toString(), newEndTime);
    }
  }

  async finalizeRound(auctionId: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const auction = await auctionService.findById(auctionId);
      if (!auction || auction.status !== 'active') {
        throw new Error('Auction not found or not active');
      }

      const itemsThisRound = await auctionService.getItemsForCurrentRound(auction);
      const activeBids = await bidService.findActiveBids(auctionId);
      
      const winners = activeBids.slice(0, itemsThisRound);
      const losers = activeBids.slice(itemsThisRound);

      let itemNumber = (auction.currentRound - 1) * auction.itemsPerRound + 1;
      for (const bid of winners) {
        await bidService.markAsWon(bid._id.toString(), itemNumber, session);
        await userService.deductFrozen(bid.userId.toString(), bid.amount, session);
        itemNumber++;
      }

      const remainingAfter = await auctionService.getRemainingItems(auction) - itemsThisRound;

      if (remainingAfter <= 0 || losers.length === 0) {
        for (const bid of losers) {
          await bidService.markAsRefunded(bid._id.toString(), session);
          await userService.unfreezeBalance(bid.userId.toString(), bid.amount, session);
        }
        await auctionService.completeAuction(auctionId, session);
      } else {
        for (const bid of losers) {
          await bidService.markAsCarried(bid._id.toString(), auction.currentRound + 1, session);
        }
        const newEndTime = new Date(Date.now() + 60 * 60 * 1000);
        await auctionService.nextRound(auctionId, newEndTime, session);
        
        for (const bid of losers) {
          await bidService.reactivateCarriedBid(bid._id.toString(), session);
        }
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getAuctionState(auctionId: string) {
    const auction = await auctionService.findById(auctionId);
    if (!auction) throw new Error('Auction not found');

    const leaderboard = await bidService.getLeaderboard(auctionId);
    const itemsThisRound = await auctionService.getItemsForCurrentRound(auction);
    const minWinningBid = leaderboard[itemsThisRound - 1]?.amount || auction.minBid;

    return {
      auction,
      currentRound: auction.currentRound,
      itemsThisRound,
      remainingItems: await auctionService.getRemainingItems(auction),
      leaderboard: leaderboard.map((bid, i) => ({
        rank: i + 1,
        odId: bid.userId,
        amount: bid.amount,
        isWinning: i < itemsThisRound
      })),
      minWinningBid,
      endsAt: auction.roundEndsAt
    };
  }
}

export const roundService = new RoundService();
