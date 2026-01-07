import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBid extends Document {
  auctionId: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  round: number;
  status: 'active' | 'won' | 'carried' | 'refunded';
  itemNumber: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const BidSchema = new Schema<IBid>({
  auctionId: { type: Schema.Types.ObjectId, ref: 'Auction', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  round: { type: Number, required: true },
  status: { type: String, enum: ['active', 'won', 'carried', 'refunded'], default: 'active' },
  itemNumber: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

BidSchema.index({ auctionId: 1, amount: -1 });
BidSchema.index({ auctionId: 1, userId: 1 });

export const Bid = mongoose.model<IBid>('Bid', BidSchema);
