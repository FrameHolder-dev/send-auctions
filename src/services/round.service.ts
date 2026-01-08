import mongoose from 'mongoose';
import { auctionService } from './auction.service.js';
import { bidService } from './bid.service.js';
import { Auction, Bid, Item, Transaction, User } from '../models/index.js';
import type { IAuction, IBid } from '../models/index.js';
import { schedulerService } from './scheduler.service.js';

export class RoundService {
  async placeBid(auctionId: string, userId: string, amount: number): Promise<IBid> {
    const auction = await auctionService.findById(auctionId);
    if (!auction) throw new Error('Auction not found');
    if (auction.status !== 'active') throw new Error('Auction is not active');
    if (new Date() > auction.roundEndsAt) throw new Error('Round has ended');
    if (amount < auction.minBid) throw new Error(`Minimum bid is ${auction.minBid}`);
    if (!Number.isInteger(amount) || amount <= 0) throw new Error('Invalid bid amount');

    const existingBid = await bidService.findUserActiveBid(auctionId, userId);

    if (existingBid) {
      if (amount <= existingBid.amount) {
        throw new Error('New bid must be higher than current bid');
      }
      const diff = amount - existingBid.amount;

      const user = await User.findOneAndUpdate(
        { _id: userId, balance: { $gte: diff } },
        { $inc: { balance: -diff, frozenBalance: diff } },
        { new: true }
      );
      if (!user) throw new Error('Insufficient balance');

      await Transaction.create({
        userId,
        auctionId: auction._id,
        bidId: existingBid._id,
        type: 'freeze',
        amount: diff,
        balanceBefore: user.balance + diff,
        balanceAfter: user.balance,
        frozenBefore: user.frozenBalance - diff,
        frozenAfter: user.frozenBalance
      });

      const bid = await Bid.findByIdAndUpdate(
        existingBid._id,
        { amount, updatedAt: new Date() },
        { new: true }
      );

      const extended = await this.checkAntiSniping(auction);
      return { ...bid!.toObject(), extended } as IBid;
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, balance: { $gte: amount } },
      { $inc: { balance: -amount, frozenBalance: amount } },
      { new: true }
    );
    if (!user) throw new Error('Insufficient balance');

    const bid = await Bid.create({
      auctionId: new mongoose.Types.ObjectId(auctionId),
      userId: new mongoose.Types.ObjectId(userId),
      amount,
      round: auction.currentRound,
      status: 'active'
    });

    await Transaction.create({
      userId,
      auctionId: auction._id,
      bidId: bid._id,
      type: 'freeze',
      amount,
      balanceBefore: user.balance + amount,
      balanceAfter: user.balance,
      frozenBefore: user.frozenBalance - amount,
      frozenAfter: user.frozenBalance
    });

    const extended = await this.checkAntiSniping(auction);
    return { ...bid.toObject(), extended } as IBid;
  }

  async checkAntiSniping(auction: IAuction): Promise<Date | null> {
    const now = new Date();
    const timeLeft = auction.roundEndsAt.getTime() - now.getTime();
    const antiSnipingMs = auction.antiSnipingSeconds * 1000;

    if (timeLeft < antiSnipingMs && timeLeft > 0) {
      const newEndTime = new Date(now.getTime() + antiSnipingMs);
      await auctionService.extendRound(auction._id.toString(), newEndTime);
      schedulerService.scheduleRoundEnd(auction._id.toString(), newEndTime);
      console.log(`Anti-sniping: extended to ${newEndTime}`);
      return newEndTime;
    }
    return null;
  }

  async finalizeRound(auctionId: string): Promise<void> {
    const auction = await Auction.findOneAndUpdate(
      { _id: auctionId, status: 'active', _processing: { $ne: true } },
      { $set: { _processing: true } },
      { new: true }
    );

    if (!auction) {
      return;
    }

    if (new Date() < auction.roundEndsAt) {
      await Auction.updateOne({ _id: auctionId }, { $unset: { _processing: 1 } });
      return;
    }

    try {
      const itemsThisRound = await auctionService.getItemsForCurrentRound(auction);
      const activeBids = await bidService.findActiveBids(auctionId);

      const winners = activeBids.slice(0, itemsThisRound);
      const losers = activeBids.slice(itemsThisRound);

      let itemNumber = (auction.currentRound - 1) * auction.itemsPerRound + 1;

      for (const bid of winners) {
        const user = await User.findOneAndUpdate(
          { _id: bid.userId, frozenBalance: { $gte: bid.amount } },
          { $inc: { frozenBalance: -bid.amount } },
          { new: true }
        );

        if (user) {
          await Item.create({
            auctionId: auction._id,
            userId: bid.userId,
            bidId: bid._id,
            itemNumber,
            paidAmount: bid.amount
          });

          await Transaction.create({
            userId: bid.userId,
            auctionId: auction._id,
            bidId: bid._id,
            type: 'win',
            amount: bid.amount,
            balanceBefore: user.balance,
            balanceAfter: user.balance,
            frozenBefore: user.frozenBalance + bid.amount,
            frozenAfter: user.frozenBalance
          });

          await Bid.findByIdAndUpdate(bid._id, {
            status: 'won',
            itemNumber,
            updatedAt: new Date()
          });

          console.log(`Winner: user ${bid.userId} won item #${itemNumber} for ${bid.amount}`);
        }
        itemNumber++;
      }

      const remainingAfter = await auctionService.getRemainingItems(auction) - winners.length;

      if (remainingAfter <= 0) {
        for (const bid of losers) {
          const user = await User.findOneAndUpdate(
            { _id: bid.userId, frozenBalance: { $gte: bid.amount } },
            { $inc: { balance: bid.amount, frozenBalance: -bid.amount } },
            { new: true }
          );

          if (user) {
            await Transaction.create({
              userId: bid.userId,
              auctionId: auction._id,
              bidId: bid._id,
              type: 'refund',
              amount: bid.amount,
              balanceBefore: user.balance - bid.amount,
              balanceAfter: user.balance,
              frozenBefore: user.frozenBalance + bid.amount,
              frozenAfter: user.frozenBalance
            });

            await Bid.findByIdAndUpdate(bid._id, {
              status: 'refunded',
              updatedAt: new Date()
            });
          }
        }

        await Auction.findByIdAndUpdate(auctionId, {
          status: 'completed',
          $unset: { _processing: 1 }
        });
        console.log(`Auction ${auctionId} completed`);
      } else {
        const roundDuration = 60 * 1000;
        const newEndTime = new Date(Date.now() + roundDuration);

        for (const bid of losers) {
          await Bid.findByIdAndUpdate(bid._id, {
            round: auction.currentRound + 1,
            updatedAt: new Date()
          });
        }

        await Auction.findByIdAndUpdate(auctionId, {
          $inc: { currentRound: 1 },
          roundEndsAt: newEndTime,
          $unset: { _processing: 1 }
        });

        console.log(`Round ${auction.currentRound} ended. Next round starts, ends at ${newEndTime}`);
        schedulerService.scheduleRoundEnd(auctionId, newEndTime);
      }
    } catch (error) {
      await Auction.updateOne({ _id: auctionId }, { $unset: { _processing: 1 } });
      throw error;
    }
  }

  async getAuctionState(auctionId: string) {
    const auction = await auctionService.findById(auctionId);
    if (!auction) throw new Error('Auction not found');

    const activeBids = await bidService.findActiveBids(auctionId);
    const itemsThisRound = await auctionService.getItemsForCurrentRound(auction);
    const remainingItems = await auctionService.getRemainingItems(auction);
    
    const minWinningBid = activeBids.length >= itemsThisRound 
      ? activeBids[itemsThisRound - 1]?.amount 
      : auction.minBid;

    const totalRounds = Math.ceil(auction.totalItems / auction.itemsPerRound);

    return {
      auction: {
        id: auction._id,
        title: auction.title,
        description: auction.description,
        status: auction.status,
        totalItems: auction.totalItems,
        itemsPerRound: auction.itemsPerRound,
        minBid: auction.minBid,
        antiSnipingSeconds: auction.antiSnipingSeconds
      },
      currentRound: auction.currentRound,
      totalRounds,
      itemsThisRound,
      remainingItems,
      totalBids: activeBids.length,
      leaderboard: activeBids.map((bid, i) => ({
        rank: i + 1,
        odId: bid.userId,
        amount: bid.amount,
        isWinning: i < itemsThisRound
      })),
      minWinningBid,
      endsAt: auction.roundEndsAt,
      timeLeft: Math.max(0, auction.roundEndsAt.getTime() - Date.now())
    };
  }

  async getUserBids(userId: string, auctionId?: string) {
    const bids = auctionId
      ? await bidService.findByAuction(auctionId)
      : await bidService.findByUser(userId);

    return bids.filter(b => b.userId.toString() === userId);
  }

  async getWonItems(userId: string) {
    return Item.find({ userId: new mongoose.Types.ObjectId(userId) })
      .populate('auctionId', 'title')
      .sort({ wonAt: -1 });
  }
}

export const roundService = new RoundService();
