import express from 'express';
import { protect, admin } from '../middleware/authMiddleware';
import { 
    getAllUsers, 
    updateUserStatus,
    updateUserRole,
    deleteUser,
    getPlatformAnalytics,
    getPendingVerifications,
    updateVerificationStatus,
    getPlatformHealth,
    triageFlaggedContent,
    getSecurityAlerts,
    dismissSecurityAlert,
    getActivityLogs,
    getUserSessions,
    terminateSession
} from '../controllers/adminController';
import { updateListing } from '../controllers/listingController';

const router = express.Router();

// All routes in this file are protected and require admin privileges
router.use(protect, admin);

router.route('/users').get(getAllUsers);
router.route('/users/:id/status').put(updateUserStatus);
router.route('/users/:id/role').put(updateUserRole);
router.route('/users/:id').delete(deleteUser);
router.route('/users/:id/sessions').get(getUserSessions);

router.route('/sessions/:id').delete(terminateSession);

router.route('/analytics').get(getPlatformAnalytics);
router.route('/activity-logs').get(getActivityLogs);

router.route('/verifications').get(getPendingVerifications);
router.route('/verifications/:id').put(updateVerificationStatus);

router.route('/security-alerts').get(getSecurityAlerts);
router.route('/security-alerts/:id').put(dismissSecurityAlert);

// Admin can also update any listing (e.g., to change status)
router.route('/listings/:id').put(updateListing);

// AI Admin Routes
router.route('/platform-health').get(getPlatformHealth);
router.route('/triage-flag/:flagId').get(triageFlaggedContent);


export default router;