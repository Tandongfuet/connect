
import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController';

const router = express.Router();

router.use(protect);

router.route('/').get(getNotifications);
router.route('/:id/read').put(markAsRead);
router.route('/read-all').put(markAllAsRead);

export default router;
