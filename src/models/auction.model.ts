import mongoose, { Schema, Document } from 'mongoose';

export interface IAuction extends Document {
  title: string;
  description: string;
  imageUrl: string;
  totalItems: number;
  itemsPerRound: number;
  currentRound: number;
  minBid: number;
  status: 'pending' | 'active' | 'completed';
  roundEndsAt: Date;
  antiSnipingSeconds: number;
  createdAt: Date;
}

const AuctionSchema = new Schema<IAuction>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  totalItems: { type: Number, required: true },
  itemsPerRound: { type: Number, required: true },
  currentRound: { type: Number, default: 1 },
  minBid: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },
  roundEndsAt: { type: Date, required: true },
  antiSnipingSeconds: { type: Number, default: 30 },
  createdAt: { type: Date, default: Date.now }
});

export const Auction = mongoose.model<IAuction>('Auction', AuctionSchema);
