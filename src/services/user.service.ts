import { User, IUser } from '../models/index.js';

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

  async updateBalance(id: string, amount: number): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { $inc: { balance: amount } }, { new: true });
  }
}

export const userService = new UserService();
