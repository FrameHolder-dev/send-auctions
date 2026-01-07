import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  balance: number;
  frozenBalance: number;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  frozenBalance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>('User', UserSchema);
