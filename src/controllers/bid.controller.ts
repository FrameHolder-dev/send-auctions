import { Request, Response } from 'express';
import { bidService } from '../services/index.js';

export class BidController {
  async create(req: Request, res: Response): Promise<void> {
    const bid = await bidService.create(req.body);
    res.status(201).json(bid);
  }

  async getByAuction(req: Request, res: Response): Promise<void> {
    const bids = await bidService.findByAuction(req.params.auctionId);
    res.json(bids);
  }

  async getByUser(req: Request, res: Response): Promise<void> {
    const bids = await bidService.findByUser(req.params.userId);
    res.json(bids);
  }
}

export const bidController = new BidController();
