// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel';
import Transaction from '../models/transactionModel';
import Session from '../models/sessionModel';
import ActivityLog from '../models/activityLogModel';
import generateToken from '../utils/generateToken';
import { Role, TransactionStatus, TransactionType } from '../constants';
import SecurityAlert from '../models/securityAlertModel';
import { sendSecurityAlertEmail } from '../services/emailService';

/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }
  
  const hasReceivedSupportGrant = role === Role.Farmer;
  const accountBalance = hasReceivedSupportGrant ? 500000 : 0;

  const user = await User.create({
    name,
    email,
    password,
    role,
    hasReceivedSupportGrant,
    accountBalance,
  });

  if (user) {
    // Log activity
    await ActivityLog.create({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'User Registered',
        details: `Role: ${role}`
    });

    if (hasReceivedSupportGrant) {
        await Transaction.create({
            userId: user._id,
            userName: user.name,
            type: TransactionType.Grant,
            amount: 500000,
            status: TransactionStatus.Completed,
            description: 'New Farmer Support Grant',
        });
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString()),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

/**
 * @desc    Auth user & get token
 * @route   POST /api/users/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    // Create Session
    await Session.create({
        userId: user._id,
        ipAddress: req.ip || 'Unknown',
        userAgent: req.headers['user-agent'] || 'Unknown',
    });

    // Log Activity
    await ActivityLog.create({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'User Logged In',
        details: `IP: ${req.ip}`
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      accountBalance: user.accountBalance,
      pendingBalance: user.pendingBalance,
      totalEarnings: user.totalEarnings,
      status: user.status,
      verificationStatus: user.verificationStatus,
      verificationTier: user.verificationTier,
      phoneNumber: user.phoneNumber,
      location: user.location,
      hasReceivedSupportGrant: user.hasReceivedSupportGrant,
      hasSeenGrantToast: user.hasSeenGrantToast,
      sellerReviewCount: user.sellerReviewCount,
      averageSellerRating: user.averageSellerRating,
      followers: user.followers,
      following: user.following,
      savedArticleIds: user.savedArticleIds,
      badges: user.badges,
      wishlist: user.wishlist,
      token: generateToken(user._id.toString()),
      notificationPreferences: user.notificationPreferences,
    });
  } else {
    res.status(401);

    if (user) {
        const alertMessage = `A failed login attempt was made on your account. If this was not you, please secure your account immediately.`;
        await SecurityAlert.create({
            userId: user._id,
            type: 'Failed Login',
            message: alertMessage,
        });
        sendSecurityAlertEmail(user.email, alertMessage);
    }
    
    throw new Error('Invalid email or password');
  }
});

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      notificationPreferences: user.notificationPreferences,
      // ... include all other safe fields
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
    user.location = req.body.location || user.location;
    if (req.body.profileImage) {
        user.profileImage = req.body.profileImage;
    }
    
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    if (req.body.hasSeenGrantToast !== undefined) {
      user.hasSeenGrantToast = req.body.hasSeenGrantToast;
    }
    
    if (req.body.notificationPreferences) {
        const { newMessages, orderUpdates, communityUpdates } = req.body.notificationPreferences;
        if (newMessages !== undefined) user.notificationPreferences!.newMessages = newMessages;
        if (orderUpdates !== undefined) user.notificationPreferences!.orderUpdates = orderUpdates;
        if (communityUpdates !== undefined) user.notificationPreferences!.communityUpdates = communityUpdates;
    }
    
    if (req.body.savedArticleIds) {
        user.savedArticleIds = req.body.savedArticleIds;
    }
    
    if (req.body.following) {
        user.following = req.body.following;
    }

    const updatedUser = await user.save();

     res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profileImage: updatedUser.profileImage,
      phoneNumber: updatedUser.phoneNumber,
      location: updatedUser.location,
      savedArticleIds: updatedUser.savedArticleIds,
      following: updatedUser.following,
      notificationPreferences: updatedUser.notificationPreferences,
      token: generateToken(updatedUser._id.toString()),
    });

  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Verify user password
 * @route   POST /api/users/verify-password
 * @access  Private
 */
const verifyPassword = asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body;
  const user = await User.findById(req.user?._id);

  if (user && (await user.matchPassword(password))) {
    res.json({ success: true });
  } else {
    res.status(401);
    throw new Error('Invalid password');
  }
});


export { registerUser, loginUser, getUserProfile, updateUserProfile, verifyPassword };