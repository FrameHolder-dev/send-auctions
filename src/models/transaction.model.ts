import mongoose, { Schema, Document, Types } from 'mongoose';

export type TransactionType = 'deposit' | 'freeze' | 'unfreeze' | 'deduct' | 'refund' | 'win';

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  auctionId: Types.ObjectId | null;
  bidId: Types.ObjectId | null;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  frozenBefore: number;
  frozenAfter: number;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  auctionId: { type: Schema.Types.ObjectId, ref: 'Auction', default: null },
  bidId: { type: Schema.Types.ObjectId, ref: 'Bid', default: null },
  type: { type: String, enum: ['deposit', 'freeze', 'unfreeze', 'deduct', 'refund', 'win'], required: true },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  frozenBefore: { type: Number, required: true },
  frozenAfter: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

TransactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
