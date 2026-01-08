import { User, IUser } from '../models/index.js';
import mongoose from 'mongoose';

export class UserService {
  async create(username: string): Promise<IUser> {
    const user = new User({ username });
    return user.save();
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return User.findOne({ username });
  }

  async deposit(id: string, amount: number): Promise<IUser | null> {
    if (amount <= 0) throw new Error('Amount must be positive');
    return User.findByIdAndUpdate(id, { $inc: { balance: amount } }, { new: true });
  }

  async freezeBalance(userId: string, amount: number, session?: mongoose.ClientSession): Promise<boolean> {
    const result = await User.updateOne(
      { _id: userId, balance: { $gte: amount } },
      { $inc: { balance: -amount, frozenBalance: amount } },
      { session }
    );
    return result.modifiedCount === 1;
  }

  async unfreezeBalance(userId: string, amount: number, session?: mongoose.ClientSession): Promise<boolean> {
    const result = await User.updateOne(
      { _id: userId, frozenBalance: { $gte: amount } },
      { $inc: { balance: amount, frozenBalance: -amount } },
      { session }
    );
    return result.modifiedCount === 1;
  }

  async deductFrozen(userId: string, amount: number, session?: mongoose.ClientSession): Promise<boolean> {
    const result = await User.updateOne(
      { _id: userId, frozenBalance: { $gte: amount } },
      { $inc: { frozenBalance: -amount } },
      { session }
    );
    return result.modifiedCount === 1;
  }
}

export const userService = new UserService();
