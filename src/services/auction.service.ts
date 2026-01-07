import { Auction, IAuction } from '../models/index.js';

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
}

export const auctionService = new AuctionService();
