// backend/src/controllers/bookingController.ts
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Booking from '../models/bookingModel';
import User from '../models/userModel';
import Platform from '../models/platformModel';
import Transaction from '../models/transactionModel';
import Notification from '../models/notificationModel';
import { BookingStatus, TransactionType, TransactionStatus } from '../constants';
import { sendNewBookingRequestEmail } from '../services/emailService';

// @desc    Create a new booking request
// @route   POST /api/bookings
// @access  Private
const createBooking = asyncHandler(async (req: Request, res: Response) => {
    const { listing, bookingDate } = req.body;
    const user = req.user!;

    const newBooking = new Booking({
        serviceId: listing.id,
        serviceTitle: listing.title,
        providerId: listing.seller.id,
        userId: user._id,
        userName: user.name,
        bookingDate,
        price: listing.price,
        category: listing.category,
    });

    const createdBooking = await newBooking.save();

    // Notify the provider via email and in-app if preferences allow
    const provider = await User.findById(listing.seller.id);
    if (provider && provider.notificationPreferences?.orderUpdates) {
        sendNewBookingRequestEmail(provider.email, provider.name, createdBooking);
        
        await Notification.create({
            userId: provider._id,
            message: `New booking request from ${user.name} for "${listing.title}".`,
            type: 'New Booking',
            link: '/dashboard',
            isRead: false
        });
    }

    res.status(201).json(createdBooking);
});

// @desc    Pay for a booking
// @route   PUT /api/bookings/:id/pay
// @access  Private
const payForBooking = asyncHandler(async (req: Request, res: Response) => {
    const booking = await Booking.findById(req.params.id);
    const user = req.user!;

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }
    
    const buyer = await User.findById(user._id);
    if (!buyer || buyer.accountBalance < booking.price) {
        res.status(400);
        throw new Error('Insufficient funds');
    }
    
    // Transaction logic
    buyer.accountBalance -= booking.price;
    await buyer.save();

    const provider = await User.findById(booking.providerId);
    if (provider) {
        provider.pendingBalance += booking.price;
        await provider.save();
        
        // Notify provider of payment
         if (provider.notificationPreferences?.orderUpdates) {
             await Notification.create({
                userId: provider._id,
                message: `Payment received for booking "${booking.serviceTitle}" from ${user.name}.`,
                type: 'General',
                link: '/dashboard',
                isRead: false
            });
        }
    }
    
    const platform = await Platform.getSettings();
    platform.escrowBalance += booking.price;
    await platform.save();

    await Transaction.create({
        userId: user._id,
        type: TransactionType.Purchase,
        amount: -booking.price,
        description: `Payment for service: "${booking.serviceTitle}"`,
        metadata: { bookingId: booking._id }
    });
    
    booking.status = BookingStatus.Processing;
    await booking.save();
    
    res.json({ message: 'Payment successful' });
});

// @desc    Get bookings for the logged-in user
// @route   GET /api/bookings/user
// @route   GET /api/bookings/user/:id  (admin or owner)
// @access  Private
const getBookingsByUser = asyncHandler(async (req: Request, res: Response) => {
    let targetId = req.user!._id;
    if (req.params.id) {
        if (req.user!.role !== 'Admin' && req.user!._id.toString() !== req.params.id) {
            res.status(403);
            throw new Error('Not authorized to view these bookings');
        }
        targetId = req.params.id as any;
    }
    const bookings = await Booking.find({ userId: targetId }).sort({ createdAt: -1 });
    res.json(bookings);
});

// @desc    Get bookings for the logged-in provider
// @route   GET /api/bookings/provider
// @route   GET /api/bookings/provider/:id  (admin or provider themselves)
// @access  Private
const getBookingsByProvider = asyncHandler(async (req: Request, res: Response) => {
    let targetId = req.user!._id;
    if (req.params.id) {
        if (req.user!.role !== 'Admin' && req.user!._id.toString() !== req.params.id) {
            res.status(403);
            throw new Error('Not authorized to view these bookings');
        }
        targetId = req.params.id as any;
    }
    const bookings = await Booking.find({ providerId: targetId }).sort({ createdAt: -1 });
    res.json(bookings);
});

// @desc    Update booking status (by provider)
// @route   PUT /api/bookings/:id/status
// @access  Private
const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (booking && booking.providerId.toString() === req.user!._id.toString()) {
        booking.status = status;
        const updatedBooking = await booking.save();
        
        // Notify user of status change
        const user = await User.findById(booking.userId);
        if (user && user.notificationPreferences?.orderUpdates) {
             await Notification.create({
                userId: user._id,
                message: `Your booking for "${booking.serviceTitle}" has been updated to: ${status}.`,
                type: 'General',
                link: '/dashboard',
                isRead: false
            });
        }
        
        res.json(updatedBooking);
    } else {
        res.status(404);
        throw new Error('Booking not found or user not authorized');
    }
});

// @desc    Confirm service completion (by user)
// @route   PUT /api/bookings/:id/complete
// @access  Private
const confirmServiceCompletion = asyncHandler(async (req: Request, res: Response) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.userId.toString() !== req.user!._id.toString()) {
        res.status(404);
        throw new Error('Booking not found or user not authorized');
    }

    booking.status = BookingStatus.Completed;
    
    const provider = await User.findById(booking.providerId);
    const platform = await Platform.getSettings();
    const commissionRate = 0.05;
    const commission = booking.price * commissionRate;
    const payout = booking.price - commission;

    if (provider) {
        provider.pendingBalance -= booking.price;
        provider.accountBalance += payout;
        provider.totalEarnings += payout;
        await provider.save();
        
        if (provider.notificationPreferences?.orderUpdates) {
             await Notification.create({
                userId: provider._id,
                message: `Service "${booking.serviceTitle}" marked as complete. Funds released.`,
                type: 'General',
                link: '/dashboard',
                isRead: false
            });
        }
    }
    
    platform.escrowBalance -= booking.price;
    platform.commissionBalance += commission;
    await platform.save();

    await Transaction.create({
        userId: booking.providerId,
        type: TransactionType.Sale,
        amount: payout,
        description: `Payout for service: "${booking.serviceTitle}"`,
        metadata: { bookingId: booking._id }
    });

    const updatedBooking = await booking.save();
    res.json(updatedBooking);
});

export { createBooking, payForBooking, getBookingsByUser, getBookingsByProvider, updateBookingStatus, confirmServiceCompletion };