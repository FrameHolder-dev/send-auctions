import { Bid, IBid } from '../models/index.js';
import { Types } from 'mongoose';

export class BidService {
  async create(data: Partial<IBid>): Promise<IBid> {
    const bid = new Bid(data);
    return bid.save();
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
}

export const bidService = new BidService();
