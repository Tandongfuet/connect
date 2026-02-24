// backend/src/controllers/orderController.ts
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel';
import User, { UserDocument } from '../models/userModel';
import Listing from '../models/listingModel';
import Platform from '../models/platformModel';
import Transaction from '../models/transactionModel';
import Notification from '../models/notificationModel'; // Import Notification model
import { OrderStatus, TransactionType, TransactionStatus, Role } from '../constants';
import { sendNewOrderConfirmationEmail, sendNewOrderNotificationForSeller } from '../services/emailService';
import { Types } from 'mongoose';

// Type guard to check if a field is populated
function isPopulated(doc: Types.ObjectId | UserDocument): doc is UserDocument {
    return (doc as UserDocument).name !== undefined;
}


// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req: Request, res: Response) => {
    const { items, totalPrice, deliveryMethod, deliveryCost, estimatedDeliveryDate } = req.body;
    const user = req.user!;

    if (!items || items.length === 0) {
        res.status(400);
        throw new Error('No order items');
    }

    // Group items by seller
    const sellerOrdersMap = new Map();
    for (const item of items) {
        const sellerId = item.listing.seller.id;
        if (!sellerOrdersMap.has(sellerId)) {
            sellerOrdersMap.set(sellerId, {
                sellerId,
                sellerName: item.listing.seller.name,
                items: [],
                subTotal: 0,
                trackingHistory: [{ status: 'Order Placed', location: 'Platform' }]
            });
        }
        const sellerOrder = sellerOrdersMap.get(sellerId);
        sellerOrder.items.push({
            listingId: item.listing.id,
            title: item.listing.title,
            price: item.listing.price,
            quantity: item.quantity,
            image: item.listing.images[0]?.url,
        });
        sellerOrder.subTotal += item.listing.price * item.quantity;
    }

    const order = new Order({
        buyerInfo: { id: user._id, name: user.name },
        sellerOrders: Array.from(sellerOrdersMap.values()),
        totalPrice,
        deliveryMethod,
        deliveryCost,
        estimatedDeliveryDate,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
});

// @desc    Get orders for logged in user
// @route   GET /api/orders
// @access  Private
const getOrdersForUser = asyncHandler(async (req: Request, res: Response) => {
    const orders = await Order.find({ 'buyerInfo.id': req.user!._id }).sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Get orders for a seller
// @route   GET /api/orders/seller
// @access  Private
const getOrdersForSeller = asyncHandler(async (req: Request, res: Response) => {
    const orders = await Order.find({ 'sellerOrders.sellerId': req.user!._id }).sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
// Added explicitly to handle single order fetch security
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id)
    .populate('buyerInfo.id', 'name email')
    .populate('sellerOrders.sellerId', 'name email');

  if (order) {
    // Security Check: Ensure user is buyer, one of the sellers, or admin
    const isBuyer = order.buyerInfo.id._id.toString() === req.user!._id.toString();
    const isSeller = order.sellerOrders.some(so => so.sellerId._id.toString() === req.user!._id.toString());
    const isAdmin = req.user!.role === Role.Admin;

    if (isBuyer || isSeller || isAdmin) {
         res.json(order);
    } else {
        res.status(403);
        throw new Error('Not authorized to view this order');
    }
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Pay for an order
// @route   PUT /api/orders/:id/pay
// @access  Private
const payForOrder = asyncHandler(async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.id);
    const user = req.user!;

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }
    
    // Ensure only the buyer can pay
    if (order.buyerInfo.id.toString() !== user._id.toString()) {
         res.status(403);
         throw new Error('Not authorized to pay for this order');
    }

    const buyer = await User.findById(user._id);
    if (!buyer || buyer.accountBalance < order.totalPrice) {
        res.status(400);
        throw new Error('Insufficient funds');
    }

    // --- Start Transaction ---
    // 1. Debit buyer
    buyer.accountBalance -= order.totalPrice;
    await buyer.save();

    // 2. Credit platform escrow
    const platform = await Platform.getSettings();
    platform.escrowBalance += order.totalPrice;
    await platform.save();

    // 3. Create transaction record for buyer
    await Transaction.create({
        userId: user._id,
        type: TransactionType.Purchase,
        amount: -order.totalPrice,
        description: `Payment for Order #${order._id.toString().slice(-6)}`,
        metadata: { orderId: order._id }
    });

    // 4. Update order status and seller pending balances
    for (const so of order.sellerOrders) {
        so.status = OrderStatus.Processing;
        so.trackingHistory.push({ status: 'Payment Confirmed. Processing.', location: 'Platform' } as any);

        const seller = await User.findById(so.sellerId);
        if (seller) {
            seller.pendingBalance += so.subTotal;
            await seller.save();

            // Send email to seller (asynchronously), respecting preferences
            if (seller.notificationPreferences?.orderUpdates) {
                sendNewOrderNotificationForSeller(seller.email, seller.name, order, so);
            }
            
            // Also create in-app notification for seller
            if (seller.notificationPreferences?.orderUpdates) {
                 await Notification.create({
                    userId: seller._id,
                    message: `New order received from ${buyer.name}.`,
                    type: 'New Booking', // Reuse type or add 'New Order'
                    link: '/dashboard', // Should link to order details
                    isRead: false
                });
            }
        }

        // 5. Reduce stock
        for (const item of so.items) {
            await Listing.findByIdAndUpdate(item.listingId, { $inc: { stock: -item.quantity } });
        }
    }
    
    await order.save();
    // --- End Transaction ---

    // Send confirmation email to buyer (asynchronously), respecting preferences
    if (buyer.notificationPreferences?.orderUpdates) {
        sendNewOrderConfirmationEmail(buyer.email, buyer.name, order);
    }

    res.json({ message: 'Payment successful' });
});

// @desc    Update order status
// @route   PUT /api/orders/:orderId/seller/:sellerId/status
// @access  Private
const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    const { orderId, sellerId } = req.params;

    const order = await Order.findById(orderId).populate('buyerInfo.id');
    if (!order) {
        res.status(404); throw new Error('Order not found');
    }

    const sellerOrder = order.sellerOrders.find(so => so.sellerId.toString() === sellerId);
    if (!sellerOrder) {
        res.status(404); throw new Error('Seller sub-order not found');
    }

    // --- Authorization ---
    const buyerId = isPopulated(order.buyerInfo.id) ? order.buyerInfo.id._id.toString() : order.buyerInfo.id.toString();
    const isSellerOfOrder = req.user!._id.toString() === sellerId;
    const isBuyerOfOrder = req.user!._id.toString() === buyerId;
    
    let authorized = false;
    // Seller can mark as Shipped or Delivered
    if (isSellerOfOrder && (status === OrderStatus.Shipped || status === OrderStatus.Delivered)) {
        authorized = true;
    }
    // Buyer can mark as Completed (confirming delivery)
    if (isBuyerOfOrder && status === OrderStatus.Completed) {
        authorized = true;
    }
    
    if (!authorized) {
        res.status(401);
        throw new Error('Not authorized to perform this action on the order');
    }
    // --- End Authorization ---


    // --- Payout logic for Completed status (triggered by buyer) ---
    if (status === OrderStatus.Completed && isBuyerOfOrder) {
        const seller = await User.findById(sellerId);
        const platform = await Platform.getSettings();
        const amount = sellerOrder.subTotal;
        const commissionRate = 0.05;
        const commission = amount * commissionRate;
        const payout = amount - commission;

        if (seller) {
            seller.pendingBalance -= amount;
            seller.accountBalance += payout;
            seller.totalEarnings += payout;
            await seller.save();
        }
        
        platform.escrowBalance -= amount;
        platform.commissionBalance += commission;
        await platform.save();

        await Transaction.create({
            userId: sellerId, type: TransactionType.Sale, amount: payout,
            description: `Payout for Order #${order._id.toString().slice(-6)}`,
            metadata: { orderId: order._id }
        });
    }
    
    // Update status and tracking history
    sellerOrder.status = status;
    sellerOrder.trackingHistory.push({ status, location: req.user!.role, date: new Date() } as any);

    // --- Notification Logic ---
    if (status === OrderStatus.Shipped || status === OrderStatus.Delivered) {
        const buyer = await User.findById(buyerId);
        if (buyer && buyer.notificationPreferences?.orderUpdates) {
            const message = `Your order from ${sellerOrder.sellerName} has been updated to: ${status}.`;
            
            await Notification.create({
                userId: buyerId,
                message: message,
                type: 'General',
                link: '/dashboard',
                isRead: false
            });
        }
    }
    // --- End Notification Logic ---

    const updatedOrder = await order.save();
    res.json(updatedOrder);
});


export { createOrder, getOrdersForUser, getOrdersForSeller, payForOrder, updateOrderStatus };