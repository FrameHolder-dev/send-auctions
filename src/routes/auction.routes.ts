import { Router } from 'express';
import { auctionController } from '../controllers/index.js';

const router = Router();

router.post('/', (req, res) => auctionController.create(req, res));
router.get('/', (req, res) => auctionController.getAll(req, res));
router.get('/active', (req, res) => auctionController.getActive(req, res));
router.get('/:id', (req, res) => auctionController.getById(req, res));
router.get('/:id/state', (req, res) => auctionController.getState(req, res));
router.post('/:id/start', (req, res) => auctionController.start(req, res));
router.post('/:id/finalize', (req, res) => auctionController.finalizeRound(req, res));

export default router;
