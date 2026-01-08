import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IItem extends Document {
  auctionId: Types.ObjectId;
  userId: Types.ObjectId;
  bidId: Types.ObjectId;
  itemNumber: number;
  paidAmount: number;
  wonAt: Date;
}

const ItemSchema = new Schema<IItem>({
  auctionId: { type: Schema.Types.ObjectId, ref: 'Auction', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bidId: { type: Schema.Types.ObjectId, ref: 'Bid', required: true },
  itemNumber: { type: Number, required: true },
  paidAmount: { type: Number, required: true },
  wonAt: { type: Date, default: Date.now }
});

ItemSchema.index({ auctionId: 1, itemNumber: 1 }, { unique: true });
ItemSchema.index({ userId: 1 });

export const Item = mongoose.model<IItem>('Item', ItemSchema);
