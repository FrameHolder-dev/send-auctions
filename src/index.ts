import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { schedulerService } from './services/index.js';
import auctionRoutes from './routes/auction.routes.js';
import userRoutes from './routes/user.routes.js';
import bidRoutes from './routes/bid.routes.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auctions', auctionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bids', bidRoutes);

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

connectDB().then(() => {
  schedulerService.start();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

export default app;
