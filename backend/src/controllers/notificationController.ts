
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Notification from '../models/notificationModel';

// @desc    Get notifications for logged in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req: Request, res: Response) => {
    const notifications = await Notification.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    res.json(notifications);
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    if (notification.userId.toString() !== req.user!._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    await Notification.updateMany(
        { userId: req.user!._id, isRead: false },
        { $set: { isRead: true } }
    );
    
    const notifications = await Notification.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    res.json(notifications);
});

export { getNotifications, markAsRead, markAllAsRead };
