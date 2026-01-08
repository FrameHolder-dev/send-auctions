import { Auction } from '../models/index.js';
import { roundService } from './round.service.js';

class SchedulerService {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  start(): void {
    this.checkInterval = setInterval(() => this.checkRounds(), 1000);
    console.log('Scheduler started');
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  private async checkRounds(): Promise<void> {
    const now = new Date();
    const expiredAuctions = await Auction.find({
      status: 'active',
      roundEndsAt: { $lte: now }
    });

    for (const auction of expiredAuctions) {
      const auctionId = auction._id.toString();
      if (!this.timers.has(auctionId)) {
        this.timers.set(auctionId, setTimeout(() => {
          this.finalizeRound(auctionId);
        }, 0));
      }
    }
  }

  private async finalizeRound(auctionId: string): Promise<void> {
    try {
      await roundService.finalizeRound(auctionId);
      console.log(`Round finalized for auction ${auctionId}`);
    } catch (error) {
      console.error(`Failed to finalize round for ${auctionId}:`, error);
    } finally {
      this.timers.delete(auctionId);
    }
  }

  scheduleRoundEnd(auctionId: string, endsAt: Date): void {
    const delay = endsAt.getTime() - Date.now();
    if (delay <= 0) {
      this.finalizeRound(auctionId);
      return;
    }

    if (this.timers.has(auctionId)) {
      clearTimeout(this.timers.get(auctionId));
    }

    this.timers.set(auctionId, setTimeout(() => {
      this.finalizeRound(auctionId);
    }, delay));
  }
}

export const schedulerService = new SchedulerService();
