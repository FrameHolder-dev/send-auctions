import { Request, Response } from 'express';
import { auctionService, roundService } from '../services/index.js';

export class AuctionController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const auction = await auctionService.create(req.body);
      res.status(201).json(auction);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create auction';
      res.status(400).json({ error: message });
    }
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

  async start(req: Request, res: Response): Promise<void> {
    const auction = await auctionService.startAuction(req.params.id);
    if (!auction) {
      res.status(404).json({ error: 'Auction not found' });
      return;
    }
    res.json(auction);
  }

  async getState(req: Request, res: Response): Promise<void> {
    try {
      const state = await roundService.getAuctionState(req.params.id);
      res.json(state);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get state';
      res.status(400).json({ error: message });
    }
  }

  async finalizeRound(req: Request, res: Response): Promise<void> {
    try {
      await roundService.finalizeRound(req.params.id);
      const state = await roundService.getAuctionState(req.params.id);
      res.json(state);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to finalize round';
      res.status(400).json({ error: message });
    }
  }
}

export const auctionController = new AuctionController();
