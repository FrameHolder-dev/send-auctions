import { Router } from 'express';
import { userController } from '../controllers/index.js';

const router = Router();

router.post('/', (req, res) => userController.create(req, res));
router.get('/:id', (req, res) => userController.getById(req, res));
router.post('/:id/deposit', (req, res) => userController.deposit(req, res));

export default router;
