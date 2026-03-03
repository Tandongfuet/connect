
// backend/src/controllers/disputeController.ts
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Dispute from '../models/disputeModel';
import Order from '../models/orderModel';
import Booking from '../models/bookingModel';
import User from '../models/userModel';
import Platform from '../models/platformModel';
import Transaction from '../models/transactionModel';
import { DisputeStatus, OrderStatus, BookingStatus, TransactionType, Role } from '../constants';
import { sendDisputeUpdateEmail } from '../services/emailService';
import { GoogleGenAI } from '@google/genai';

// AI client may be disabled if API_KEY is unset
let ai: any;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn('WARNING: API_KEY not set; AI features in disputes will be disabled.');
    ai = {
        models: {
            generateContent: async () => ({ text: '' }),
        },
    };
}


// @desc    Submit a dispute for an order or booking
// @route   POST /api/disputes
// @access  Private
const submitDispute = asyncHandler(async (req: Request, res: Response) => {
    const { orderId, bookingId, sellerId, reasonCategory, reasonMessage } = req.body;
    const user = req.user!;

    let subject;
    let seller;
    let orderTotal;

    if (orderId) {
        const order = await Order.findById(orderId);
        if (!order) throw new Error('Order not found');
        const sellerOrder = order.sellerOrders.find(so => so.sellerId.toString() === sellerId);
        if (!sellerOrder) throw new Error('Seller order not found');

        sellerOrder.status = OrderStatus.Disputed;
        await order.save();
        
        subject = { orderId };
        seller = await User.findById(sellerId);
        orderTotal = sellerOrder.subTotal;
    } else if (bookingId) {
        const booking = await Booking.findById(bookingId);
        if (!booking) throw new Error('Booking not found');
        
        booking.status = BookingStatus.Disputed;
        await booking.save();
        
        subject = { bookingId };
        seller = await User.findById(booking.providerId);
        orderTotal = booking.price;
    } else {
        res.status(400);
        throw new Error('An orderId or bookingId must be provided');
    }

    if (!seller) throw new Error('Seller not found');

    const dispute = new Dispute({
        ...subject,
        buyerId: user._id,
        buyerName: user.name,
        sellerId: seller._id,
        reason: reasonMessage,
        reasonCategory,
        orderTotal,
        conversation: [{
            userId: user._id,
            userName: user.name,
            userRole: user.role,
            message: `[${reasonCategory}] ${reasonMessage}`,
        }],
    });
    
    const createdDispute = await dispute.save();

    // Send emails
    const admin = await User.findOne({ role: Role.Admin });
    sendDisputeUpdateEmail(seller.email, seller.name, createdDispute, `A new dispute has been opened by ${user.name}.`);
    if (admin) {
        sendDisputeUpdateEmail(admin.email, 'Admin', createdDispute, `A new dispute has been opened between ${user.name} and ${seller.name}.`);
    }

    res.status(201).json(createdDispute);
});

// @desc    Get disputes for the logged-in user
// @route   GET /api/disputes
// @route   GET /api/disputes/user/:id  (admin or self)
// @access  Private
const getDisputesByUser = asyncHandler(async (req: Request, res: Response) => {
    let userId = req.user!._id;
    if (req.params.id) {
        if (req.user!.role !== Role.Admin && req.user!._id.toString() !== req.params.id) {
            res.status(403);
            throw new Error('Not authorized to view these disputes');
        }
        userId = req.params.id as any;
    }
    const disputes = await Dispute.find({ 
        $or: [{ buyerId: userId }, { sellerId: userId }] 
    }).sort({ createdAt: -1 });
    res.json(disputes);
});

// @desc    Get all disputes (admin only)
// @route   GET /api/disputes/all
// @access  Private/Admin
const getAllDisputes = asyncHandler(async (req: Request, res: Response) => {
    const disputes = await Dispute.find({}).sort({ createdAt: -1 });
    res.json(disputes);
});

// @desc    Get dispute by ID
// @route   GET /api/disputes/:id
// @access  Private
const getDisputeById = asyncHandler(async (req: Request, res: Response) => {
    const dispute = await Dispute.findById(req.params.id)
        .populate('orderId')
        .populate('bookingId')
        .populate('sellerId', 'name email'); // Populate email for notifications

    if (dispute) {
        res.json(dispute);
    } else {
        res.status(404);
        throw new Error('Dispute not found');
    }
});

// @desc    Add a message to a dispute
// @route   POST /api/disputes/:id/message
// @access  Private
const addMessageToDispute = asyncHandler(async (req: Request, res: Response) => {
    const dispute = await Dispute.findById(req.params.id).populate('buyerId', 'name email').populate('sellerId', 'name email');
    const user = req.user!;

    if (dispute) {
        const messageItem = {
            userId: user._id,
            userName: user.name,
            userRole: user.role,
            message: req.body.message,
        };
        dispute.conversation.push(messageItem as any);
        const updatedDispute = await dispute.save();
        
        // Notify other parties
        const message = `${user.name} has added a new message to the dispute.`;
        const buyer = dispute.buyerId as any;
        const seller = dispute.sellerId as any;
        const admin = await User.findOne({ role: Role.Admin });

        if (user._id.toString() === buyer._id.toString()) { // Buyer sent message
            sendDisputeUpdateEmail(seller.email, seller.name, updatedDispute, message);
        } else { // Seller sent message
            sendDisputeUpdateEmail(buyer.email, buyer.name, updatedDispute, message);
        }

        if (admin && user.role !== Role.Admin) {
            sendDisputeUpdateEmail(admin.email, 'Admin', updatedDispute, message);
        }

        res.json(updatedDispute);
    } else {
        res.status(404);
        throw new Error('Dispute not found');
    }
});

// @desc    Resolve a dispute (admin only)
// @route   PUT /api/disputes/:id/resolve
// @access  Private/Admin
const resolveDispute = asyncHandler(async (req: Request, res: Response) => {
    const { resolution, details } = req.body;
    const dispute = await Dispute.findById(req.params.id);

    if (!dispute) {
        res.status(404);
        throw new Error('Dispute not found');
    }

    dispute.status = DisputeStatus.Resolved;
    dispute.resolutionDetails = details;

    const buyer = await User.findById(dispute.buyerId);
    const seller = await User.findById(dispute.sellerId);
    const platform = await Platform.getSettings();
    const amount = dispute.orderTotal;

    if (resolution === 'Refund Buyer' && buyer && seller) {
        platform.escrowBalance -= amount;
        buyer.accountBalance += amount;
        seller.pendingBalance -= amount;
        await Transaction.create({
            userId: buyer._id, type: TransactionType.Refund, amount,
            description: `Refund for dispute #${dispute._id.toString().slice(-6)}`
        });
    } else if (resolution === 'Release to Seller' && seller) {
        const commissionRate = 0.05;
        const commission = amount * commissionRate;
        const payout = amount - commission;
        
        platform.escrowBalance -= amount;
        platform.commissionBalance += commission;
        seller.pendingBalance -= amount;
        seller.accountBalance += payout;
        seller.totalEarnings += payout;
         await Transaction.create({
            userId: seller._id, type: TransactionType.Sale, amount: payout,
            description: `Payout for dispute #${dispute._id.toString().slice(-6)}`
        });
    }
    
    await buyer?.save();
    await seller?.save();
    await platform?.save();
    const updatedDispute = await dispute.save();
    
    // Notify participants of resolution
    const message = `This dispute has been resolved by an administrator. Resolution: ${resolution}. Details: ${details}`;
    if(buyer) sendDisputeUpdateEmail(buyer.email, buyer.name, updatedDispute, message);
    if(seller) sendDisputeUpdateEmail(seller.email, seller.name, updatedDispute, message);

    res.json(updatedDispute);
});


// --- AI Helpers for Disputes ---

const generateDisputeSummary = asyncHandler(async (req: Request, res: Response) => {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) { res.status(404); throw new Error("Dispute not found"); }
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Summarize the following dispute conversation into 3-4 bullet points. Conversation: ${JSON.stringify(dispute.conversation)}`
        });
        res.json({ summary: response.text });
    } catch (error) {
        console.error("AI Dispute Summary Failed:", error);
        res.json({ summary: "AI summary unavailable." });
    }
});

const generateDisputeAdvice = asyncHandler(async (req: Request, res: Response) => {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) { res.status(404); throw new Error("Dispute not found"); }
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Based on this dispute, provide neutral advice to help the parties reach a resolution. Dispute: ${JSON.stringify(dispute)}`
        });
        res.json({ advice: response.text });
    } catch (error) {
        console.error("AI Dispute Advice Failed:", error);
        res.json({ advice: "AI advice unavailable." });
    }
});

const generateSupportReply = asyncHandler(async (req: Request, res: Response) => {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) { res.status(404); throw new Error("Dispute not found"); }
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are a support agent for AgroConnect. Draft a professional and empathetic reply to all participants in this dispute, asking for more information or guiding them toward a resolution. Dispute: ${JSON.stringify(dispute)}`
        });
        res.json({ reply: response.text });
    } catch (error) {
        console.error("AI Support Reply Failed:", error);
        res.json({ reply: "Could not generate reply draft." });
    }
});

const generateDisputeReplySuggestion = asyncHandler(async (req: Request, res: Response) => {
    const { message } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) { res.status(404); throw new Error("Dispute not found"); }
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `As a neutral mediator, suggest a helpful reply to this message: "${message}" in the context of this dispute: ${JSON.stringify(dispute.conversation)}`
        });
        res.json({ suggestion: response.text });
    } catch (error) {
        console.error("AI Reply Suggestion Failed:", error);
        res.json({ suggestion: "Suggestion unavailable." });
    }
});


export { 
    submitDispute, 
    getDisputesByUser, 
    getAllDisputes, 
    getDisputeById, 
    addMessageToDispute, 
    resolveDispute,
    generateDisputeSummary,
    generateDisputeAdvice,
    generateSupportReply,
    generateDisputeReplySuggestion
};
