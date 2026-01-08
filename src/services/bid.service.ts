import { Bid, IBid } from '../models/index.js';
import mongoose, { Types } from 'mongoose';

export class BidService {
  async create(data: Partial<IBid>, session?: mongoose.ClientSession): Promise<IBid> {
    const [bid] = await Bid.create([data], { session });
    return bid;
  }

  async findById(id: string): Promise<IBid | null> {
    return Bid.findById(id);
  }

  async findByAuction(auctionId: string): Promise<IBid[]> {
    return Bid.find({ auctionId: new Types.ObjectId(auctionId) }).sort({ amount: -1 });
  }

  async findByUser(userId: string): Promise<IBid[]> {
    return Bid.find({ userId: new Types.ObjectId(userId) });
  }

  async findActiveBids(auctionId: string): Promise<IBid[]> {
    return Bid.find({ 
      auctionId: new Types.ObjectId(auctionId), 
      status: 'active' 
    }).sort({ amount: -1 });
  }

  async findUserActiveBid(auctionId: string, userId: string): Promise<IBid | null> {
    return Bid.findOne({
      auctionId: new Types.ObjectId(auctionId),
      userId: new Types.ObjectId(userId),
      status: 'active'
    });
  }

  async updateBidAmount(bidId: string, newAmount: number, session?: mongoose.ClientSession): Promise<IBid | null> {
    return Bid.findByIdAndUpdate(
      bidId,
      { amount: newAmount, updatedAt: new Date() },
      { new: true, session }
    );
  }

  async markAsWon(bidId: string, itemNumber: number, session?: mongoose.ClientSession): Promise<IBid | null> {
    return Bid.findByIdAndUpdate(
      bidId,
      { status: 'won', itemNumber, updatedAt: new Date() },
      { new: true, session }
    );
  }

  async markAsCarried(bidId: string, newRound: number, session?: mongoose.ClientSession): Promise<IBid | null> {
    return Bid.findByIdAndUpdate(
      bidId,
      { status: 'carried', round: newRound, updatedAt: new Date() },
      { new: true, session }
    );
  }

  async reactivateCarriedBid(bidId: string, session?: mongoose.ClientSession): Promise<IBid | null> {
    return Bid.findByIdAndUpdate(
      bidId,
      { status: 'active', updatedAt: new Date() },
      { new: true, session }
    );
  }

  async markAsRefunded(bidId: string, session?: mongoose.ClientSession): Promise<IBid | null> {
    return Bid.findByIdAndUpdate(
      bidId,
      { status: 'refunded', updatedAt: new Date() },
      { new: true, session }
    );
  }

  async getLeaderboard(auctionId: string, limit?: number): Promise<IBid[]> {
    const query = Bid.find({
      auctionId: new Types.ObjectId(auctionId),
      status: 'active'
    }).sort({ amount: -1 });
    
    if (limit) query.limit(limit);
    return query.populate('userId', 'username');
  }
}

export const bidService = new BidService();
