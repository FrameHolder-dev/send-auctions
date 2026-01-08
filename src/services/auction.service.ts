import { Auction, IAuction } from '../models/index.js';
import mongoose from 'mongoose';

export class AuctionService {
  async create(data: Partial<IAuction>): Promise<IAuction> {
    const auction = new Auction(data);
    return auction.save();
  }

  async findById(id: string): Promise<IAuction | null> {
    return Auction.findById(id);
  }

  async findAll(): Promise<IAuction[]> {
    return Auction.find();
  }

  async findActive(): Promise<IAuction[]> {
    return Auction.find({ status: 'active' });
  }

  async startAuction(id: string): Promise<IAuction | null> {
    return Auction.findByIdAndUpdate(id, { status: 'active' }, { new: true });
  }

  async nextRound(id: string, newEndTime: Date, session?: mongoose.ClientSession): Promise<IAuction | null> {
    return Auction.findByIdAndUpdate(
      id,
      { $inc: { currentRound: 1 }, roundEndsAt: newEndTime },
      { new: true, session }
    );
  }

  async completeAuction(id: string, session?: mongoose.ClientSession): Promise<IAuction | null> {
    return Auction.findByIdAndUpdate(id, { status: 'completed' }, { new: true, session });
  }

  async extendRound(id: string, newEndTime: Date): Promise<IAuction | null> {
    return Auction.findByIdAndUpdate(id, { roundEndsAt: newEndTime }, { new: true });
  }

  async getRemainingItems(auction: IAuction): Promise<number> {
    const distributedItems = (auction.currentRound - 1) * auction.itemsPerRound;
    return Math.max(0, auction.totalItems - distributedItems);
  }

  async getItemsForCurrentRound(auction: IAuction): Promise<number> {
    const remaining = await this.getRemainingItems(auction);
    return Math.min(remaining, auction.itemsPerRound);
  }
}

export const auctionService = new AuctionService();
