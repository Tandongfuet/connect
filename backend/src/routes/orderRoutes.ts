import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { 
    createOrder, 
    getOrdersForUser, 
    getOrdersForSeller, 
    payForOrder, 
    updateOrderStatus 
} from '../controllers/orderController';

const router = express.Router();

router.use(protect);

router.route('/').post(createOrder).get(getOrdersForUser);
router.route('/seller').get(getOrdersForSeller);
router.route('/:id/pay').put(payForOrder);
router.route('/:orderId/seller/:sellerId/status').put(updateOrderStatus);

export default router;