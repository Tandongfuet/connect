import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Transaction from '../models/transactionModel';
import User from '../models/userModel';
import { TransactionType, TransactionStatus } from '../constants';

// @desc    Get transactions for logged in user
// @route   GET /api/transactions
// @access  Private
const getMyTransactions = asyncHandler(async (req: Request, res: Response) => {
    const transactions = await Transaction.find({ userId: req.user!._id }).sort({ date: -1 });
    res.json(transactions);
});

// @desc    Deposit funds into user wallet
// @route   POST /api/transactions/deposit
// @access  Private
const depositFunds = asyncHandler(async (req: Request, res: Response) => {
    const { amount, provider, phoneNumber } = req.body;
    const user = req.user!;
    
    // In a real app, you would verify the payment with the provider here.
    // We simulate a successful deposit.
    
    user.accountBalance += amount;
    const updatedUser = await user.save();

    await Transaction.create({
        userId: user._id,
        userName: user.name,
        type: TransactionType.Deposit,
        amount,
        status: TransactionStatus.Completed,
        description: `Deposit from ${provider}`,
        metadata: { provider, phoneNumber }
    });
    
    res.json(updatedUser);
});

// @desc    Withdraw funds from user wallet
// @route   POST /api/transactions/withdraw
// @access  Private
const withdrawFunds = asyncHandler(async (req: Request, res: Response) => {
    const { amount, provider, phoneNumber, verifiedAccountHolder } = req.body;
    const user = req.user!;

    if (user.accountBalance < amount) {
        res.status(400);
        throw new Error('Insufficient funds');
    }

    // In a real app, you would initiate the disbursement to the provider here.
    // We simulate a successful withdrawal.

    user.accountBalance -= amount;
    const updatedUser = await user.save();

    const transaction = await Transaction.create({
        userId: user._id,
        userName: user.name,
        type: TransactionType.Withdrawal,
        amount: -amount,
        status: TransactionStatus.Completed,
        description: `Withdrawal to ${provider}`,
        metadata: { provider, phoneNumber, verifiedAccountHolder }
    });
    
    res.json({ updatedUser, transaction });
});

// @desc    Transfer funds to another user
// @route   POST /api/transactions/transfer
// @access  Private
const transferFunds = asyncHandler(async (req: Request, res: Response) => {
    const { recipientEmail, amount } = req.body;
    const sender = req.user!;

    if (sender.accountBalance < amount) {
        res.status(400);
        throw new Error('Insufficient funds');
    }
    
    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
        res.status(404);
        throw new Error('Recipient not found');
    }

    if (sender._id.equals(recipient._id)) {
        res.status(400);
        throw new Error('Cannot transfer funds to yourself');
    }

    // Perform the transfer
    sender.accountBalance -= amount;
    recipient.accountBalance += amount;

    // Save both users
    const updatedSender = await sender.save();
    await recipient.save();

    // Create transactions for both parties
    await Transaction.create({
        userId: sender._id,
        type: TransactionType.Transfer,
        amount: -amount,
        description: `Transfer to ${recipient.name}`,
        metadata: { transferPeer: `To: ${recipient.name}` }
    });

    await Transaction.create({
        userId: recipient._id,
        type: TransactionType.Transfer,
        amount: amount,
        description: `Transfer from ${sender.name}`,
        metadata: { transferPeer: `From: ${sender.name}` }
    });

    res.json(updatedSender);
});


export { getMyTransactions, depositFunds, withdrawFunds, transferFunds };