import { Router } from 'express';
import { auctionController } from '../controllers/index.js';

const router = Router();

router.post('/', (req, res) => auctionController.create(req, res));
router.get('/', (req, res) => auctionController.getAll(req, res));
router.get('/active', (req, res) => auctionController.getActive(req, res));
router.get('/:id', (req, res) => auctionController.getById(req, res));

export default router;
