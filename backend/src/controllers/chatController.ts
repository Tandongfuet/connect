import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User, { UserDocument } from '../models/userModel';
import Message from '../models/messageModel';
import Order from '../models/orderModel';
import { Types } from 'mongoose';
import { getIO } from '../socket';

// Type guard to check if a field is populated
function isPopulated(doc: Types.ObjectId | UserDocument): doc is UserDocument {
    return (doc as UserDocument).name !== undefined;
}

// @desc    Get chat contacts for logged in user
// @route   GET /api/chat/contacts
// @access  Private
const getChatContacts = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id;

    // Find all orders where the user is either the buyer or one of the sellers
    const orders = await Order.find({
        $or: [
            { 'buyerInfo.id': userId },
            { 'sellerOrders.sellerId': userId }
        ]
    }).populate('buyerInfo.id').populate('sellerOrders.sellerId');

    const contactIds = new Set<string>();

    orders.forEach(order => {
        const buyerId = isPopulated(order.buyerInfo.id) ? order.buyerInfo.id._id.toString() : order.buyerInfo.id.toString();

        if (buyerId === userId.toString()) {
            // User is the buyer, add all sellers
            order.sellerOrders.forEach(so => {
                const sellerId = isPopulated(so.sellerId) ? so.sellerId._id.toString() : so.sellerId.toString();
                contactIds.add(sellerId);
            });
        } else {
            // User is a seller, add the buyer
            contactIds.add(buyerId);
        }
    });

    // Also check for existing messages to include contacts even if no orders exist
    const messages = await Message.find({
        $or: [{ senderId: userId }, { receiverId: userId }]
    });
    
    messages.forEach(msg => {
        const otherId = msg.senderId.toString() === userId.toString() ? msg.receiverId.toString() : msg.senderId.toString();
        contactIds.add(otherId);
    });

    const contacts = await User.find({ _id: { $in: Array.from(contactIds) } }).select('name email role profileImage');
    res.json(contacts);
});


// @desc    Get messages between two users
// @route   GET /api/chat/messages/:userId
// @access  Private
const getMessagesBetweenUsers = asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!._id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
        $or: [
            { senderId: currentUserId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: currentUserId }
        ]
    }).sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
        { senderId: otherUserId, receiverId: currentUserId, isRead: false },
        { isRead: true }
    );

    res.json(messages);
});

// @desc    Send a message
// @route   POST /api/chat/messages
// @access  Private
const sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const { receiverId, content } = req.body;
    const senderId = req.user!._id;

    const message = new Message({
        senderId,
        receiverId,
        content
    });

    const createdMessage = await message.save();

    // Real-time socket emission
    try {
        const io = getIO();
        // Emit to the specific chat room (topic)
        const topic = `chat_${[senderId.toString(), receiverId.toString()].sort().join('_')}`;
        io.to(topic).emit('receive_message', createdMessage);
        
        // Check receiver preferences before sending notification
        const receiver = await User.findById(receiverId);
        if (receiver && receiver.notificationPreferences?.newMessages) {
            // Also emit to the receiver's personal room for notifications
            io.to(receiverId).emit('notification', {
                type: 'New Inquiry',
                message: `New message from ${req.user!.name}`,
                link: `/chat/${senderId}`
            });
        }
        
    } catch (error) {
        console.error("Socket emission failed", error);
        // Continue execution, don't fail the request just because socket failed
    }

    res.status(201).json(createdMessage);
});

export { getChatContacts, getMessagesBetweenUsers, sendMessage };