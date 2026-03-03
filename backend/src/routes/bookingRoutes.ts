import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { 
    createBooking, 
    payForBooking,
    getBookingsByUser, 
    getBookingsByProvider, 
    updateBookingStatus, 
    confirmServiceCompletion 
} from '../controllers/bookingController';

const router = express.Router();

router.route('/').post(protect, createBooking);
router.route('/user').get(protect, getBookingsByUser);
router.route('/user/:id').get(protect, getBookingsByUser); // allow fetching by id (admin/self)
router.route('/provider').get(protect, getBookingsByProvider);
router.route('/provider/:id').get(protect, getBookingsByProvider); // allow fetching by id (admin/self)
router.route('/:id/pay').put(protect, payForBooking);
router.route('/:id/status').put(protect, updateBookingStatus);
router.route('/:id/complete').put(protect, confirmServiceCompletion);

export default router;