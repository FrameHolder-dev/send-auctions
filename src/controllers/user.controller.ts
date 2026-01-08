import { Request, Response } from 'express';
import { userService } from '../services/index.js';

export class UserController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.create(req.body.username);
      res.status(201).json(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      res.status(400).json({ error: message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const user = await userService.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  }

  async deposit(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.deposit(req.params.id, req.body.amount);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to deposit';
      res.status(400).json({ error: message });
    }
  }
}

export const userController = new UserController();
