import { Request, Response } from 'express';
import { auctionService } from '../services/index.js';

export class AuctionController {
  async create(req: Request, res: Response): Promise<void> {
    const auction = await auctionService.create(req.body);
    res.status(201).json(auction);
  }

  async getAll(_req: Request, res: Response): Promise<void> {
    const auctions = await auctionService.findAll();
    res.json(auctions);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const auction = await auctionService.findById(req.params.id);
    if (!auction) {
      res.status(404).json({ error: 'Auction not found' });
      return;
    }
    res.json(auction);
  }

  async getActive(_req: Request, res: Response): Promise<void> {
    const auctions = await auctionService.findActive();
    res.json(auctions);
  }
}

export const auctionController = new AuctionController();
