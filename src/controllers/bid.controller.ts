import { Request, Response } from 'express';
import { bidService, roundService } from '../services/index.js';

export class BidController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { auctionId, userId, amount } = req.body;
      const bid = await roundService.placeBid(auctionId, userId, amount);
      res.status(201).json(bid);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to place bid';
      res.status(400).json({ error: message });
    }
  }

  async getByAuction(req: Request, res: Response): Promise<void> {
    const bids = await bidService.findByAuction(req.params.auctionId);
    res.json(bids);
  }

  async getByUser(req: Request, res: Response): Promise<void> {
    const bids = await bidService.findByUser(req.params.userId);
    res.json(bids);
  }

  async getLeaderboard(req: Request, res: Response): Promise<void> {
    const state = await roundService.getAuctionState(req.params.auctionId);
    res.json(state);
  }
}

export const bidController = new BidController();
