
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel';
import Listing from '../models/listingModel';
import Order from '../models/orderModel';
import Platform from '../models/platformModel';
import Transaction from '../models/transactionModel';
import FlaggedContent from '../models/flaggedContentModel';
import SecurityAlert from '../models/securityAlertModel';
import ActivityLog from '../models/activityLogModel';
import Session from '../models/sessionModel';
import { Role, VerificationStatus, VerificationTier, DisputeStatus } from '../constants';
import { GoogleGenAI } from '@google/genai';

// AI client optionally stubbed when API key is missing
let ai: any;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn('WARNING: API_KEY not set; some admin AI features will be disabled.');
    ai = { models: { generateContent: async () => ({ text: '' }) } };
}

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await User.find({}).select('-password');
    res.json(users);
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id);
    if (user) {
        user.status = req.body.status;
        const updatedUser = await user.save();
        res.json(updatedUser);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id);
    if (user) {
        user.role = req.body.role;
        const updatedUser = await user.save();
        res.json(updatedUser);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id);
    if (user) {
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getPlatformAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const totalUsers = await User.countDocuments({ role: { $ne: Role.Admin }});
    const totalListings = await Listing.countDocuments();
    const totalOrders = await Order.countDocuments();
    const platform = await Platform.getSettings();

    res.json({
        totalUsers,
        totalListings,
        totalOrders,
        totalRevenue: platform.commissionBalance,
    });
});

// @desc    Get pending verifications
// @route   GET /api/admin/verifications
// @access  Private/Admin
const getPendingVerifications = asyncHandler(async (req: Request, res: Response) => {
    const users = await User.find({ verificationStatus: VerificationStatus.Pending });
    res.json(users);
});

// @desc    Update verification status
// @route   PUT /api/admin/verifications/:id
// @access  Private/Admin
const updateVerificationStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status, tier } = req.body;
    const user = await User.findById(req.params.id);

    if (user) {
        user.verificationStatus = status;
        if (status === VerificationStatus.Verified) {
            user.verificationTier = tier || (user.businessRegistrationNumber ? VerificationTier.Silver : VerificationTier.Bronze);
        } else {
            user.verificationTier = VerificationTier.None;
        }
        const updatedUser = await user.save();
        res.json(updatedUser);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get security alerts
// @route   GET /api/admin/security-alerts
// @access  Private/Admin
const getSecurityAlerts = asyncHandler(async (req: Request, res: Response) => {
    const alerts = await SecurityAlert.find({}).sort({ timestamp: -1 });
    res.json(alerts);
});

// @desc    Dismiss security alert
// @route   PUT /api/admin/security-alerts/:id
// @access  Private/Admin
const dismissSecurityAlert = asyncHandler(async (req: Request, res: Response) => {
    const alert = await SecurityAlert.findById(req.params.id);
    if (alert) {
        alert.isRead = true;
        await alert.save();
        res.json(alert);
    } else {
        res.status(404);
        throw new Error('Alert not found');
    }
});

// @desc    Get activity logs
// @route   GET /api/admin/activity-logs
// @access  Private/Admin
const getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
    const logs = await ActivityLog.find({}).sort({ timestamp: -1 }).limit(100);
    res.json(logs);
});

// @desc    Get user sessions
// @route   GET /api/admin/users/:id/sessions
// @access  Private/Admin
const getUserSessions = asyncHandler(async (req: Request, res: Response) => {
    const sessions = await Session.find({ userId: req.params.id }).sort({ loginTime: -1 });
    res.json(sessions);
});

// @desc    Terminate session
// @route   DELETE /api/admin/sessions/:id
// @access  Private/Admin
const terminateSession = asyncHandler(async (req: Request, res: Response) => {
    const session = await Session.findById(req.params.id);
    if (session) {
        await session.deleteOne();
        res.json({ message: 'Session terminated' });
    } else {
        res.status(404);
        throw new Error('Session not found');
    }
});

// --- AI Endpoints for Admin ---

const getPlatformHealth = asyncHandler(async (req: Request, res: Response) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklySignups = await User.countDocuments({ createdAt: { $gte: oneWeekAgo } });
    const weeklyTransactions = await Transaction.countDocuments({ date: { $gte: oneWeekAgo } });
    const unresolvedFlags = await FlaggedContent.countDocuments({ isResolved: false });
    
    const dataSummary = `Current platform activity shows ${weeklySignups} new users and ${weeklyTransactions} transactions in the last 7 days. There are ${unresolvedFlags} unresolved flags.`;

    let aiSummary = "AI analysis is currently unavailable. System metrics are operating normally.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this platform data and provide a 2-3 sentence summary of platform health, mentioning if activity is good or needs attention. Data: ${dataSummary}`
        });
        if (response.text) {
            aiSummary = response.text;
        }
    } catch (error) {
        console.error("AI Platform Health Check Failed:", error);
    }

    res.json({
        weeklySignups,
        weeklyTransactions,
        flaggedContent: unresolvedFlags,
        aiSummary
    });
});

const triageFlaggedContent = asyncHandler(async (req: Request, res: Response) => {
    const flag = await FlaggedContent.findById(req.params.flagId);
    if (!flag) {
        res.status(404);
        throw new Error('Flagged content not found');
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Triage this flagged content. Based on the reason "${flag.reason}" and content "${flag.contentPreview}", determine a priority (Low, Medium, Critical) and suggest an action (e.g., "Dismiss flag", "Delete content", "Suspend user"). Return a JSON object with keys "priority" and "suggestedAction".`,
            config: { responseMimeType: 'application/json' }
        });
        
        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error("AI Triage Failed:", error);
        res.json({
            priority: 'Medium',
            suggestedAction: 'Review manually (AI Unavailable)'
        });
    }
});


export { 
    getAllUsers, 
    updateUserStatus, 
    updateUserRole,
    deleteUser,
    getPlatformAnalytics,
    getPendingVerifications,
    updateVerificationStatus,
    getSecurityAlerts,
    dismissSecurityAlert,
    getActivityLogs,
    getUserSessions,
    terminateSession,
    getPlatformHealth,
    triageFlaggedContent
};
