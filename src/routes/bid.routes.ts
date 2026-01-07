import { Router } from 'express';
import { bidController } from '../controllers/index.js';

const router = Router();

router.post('/', (req, res) => bidController.create(req, res));
router.get('/auction/:auctionId', (req, res) => bidController.getByAuction(req, res));
router.get('/user/:userId', (req, res) => bidController.getByUser(req, res));

export default router;
