import express from 'express';
import { protect, admin } from '../middleware/authMiddleware';
import { 
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
} from '../controllers/disputeController';

const router = express.Router();

router.use(protect);

router.route('/').post(submitDispute).get(getDisputesByUser);
router.route('/user/:id').get(getDisputesByUser); // compatibility for fetching by id
router.route('/all').get(admin, getAllDisputes); // Admin only
router.route('/:id').get(getDisputeById);
router.route('/:id/message').post(addMessageToDispute);
router.route('/:id/resolve').put(admin, resolveDispute); // Admin only

// AI Routes for Disputes
router.route('/:id/ai-summary').get(admin, generateDisputeSummary);
router.route('/:id/ai-advice').get(generateDisputeAdvice); // Can be used by participants
router.route('/:id/ai-support-reply').get(admin, generateSupportReply);
router.route('/:id/ai-reply-suggestion').post(admin, generateDisputeReplySuggestion);


export default router;