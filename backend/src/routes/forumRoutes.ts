import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { 
    createForumPost, 
    getForumPosts, 
    getForumPostById, 
    createForumReply, 
    toggleLike 
} from '../controllers/communityController';

const router = express.Router();

router.route('/').get(getForumPosts).post(protect, createForumPost);
router.route('/:id').get(getForumPostById);
router.route('/:id/reply').post(protect, createForumReply);
router.route('/like/:contentId').put(protect, toggleLike);

export default router;