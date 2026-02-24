import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getMyTransactions, depositFunds, withdrawFunds, transferFunds } from '../controllers/transactionController';

const router = express.Router();

router.use(protect);

router.route('/').get(getMyTransactions);
router.route('/deposit').post(depositFunds);
router.route('/withdraw').post(withdrawFunds);
router.route('/transfer').post(transferFunds);

export default router;