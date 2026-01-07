import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import auctionRoutes from './routes/auction.routes.js';
import userRoutes from './routes/user.routes.js';
import bidRoutes from './routes/bid.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auctions', auctionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bids', bidRoutes);

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

export default app;
