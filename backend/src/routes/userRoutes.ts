import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { 
    getUserById, 
    toggleFollow, 
    getWishlist, 
    addToWishlist, 
    removeFromWishlist, 
    getUsers,
    deleteSelf,
    updateTaskProgress,
    clearTaskProgress,
    getProduceSubscriptions,
    toggleProduceSubscription,
    createSellerReview,
    getSellerReviews,
    getUserFollowers,
    getUserFollowing,
    getUserFeed
} from '../controllers/userController';

const router = express.Router();

// @route   GET /api/users
router.route('/').get(protect, getUsers);

// @route   DELETE /api/users/profile (Delete self)
router.route('/profile').delete(protect, deleteSelf);

// @route   PUT /api/users/follow/:id
router.route('/follow/:id').put(protect, toggleFollow);

// @route   GET /api/users/:id/followers
router.route('/:id/followers').get(getUserFollowers);

// @route   GET /api/users/:id/following
router.route('/:id/following').get(getUserFollowing);

// @route   GET /api/users/:id/feed
router.route('/:id/feed').get(protect, getUserFeed);

// @route   GET /api/users/wishlist
router.route('/wishlist')
    .get(protect, getWishlist)
    .post(protect, addToWishlist);

// @route   DELETE /api/users/wishlist/:listingId
router.route('/wishlist/:listingId').delete(protect, removeFromWishlist);

// @route   PUT /api/users/tasks
router.route('/tasks')
    .put(protect, updateTaskProgress);

// @route   DELETE /api/users/tasks/:taskId
router.route('/tasks/:taskId').delete(protect, clearTaskProgress);

// @route   GET / PUT /api/users/subscriptions
router.route('/subscriptions')
    .get(protect, getProduceSubscriptions)
    .put(protect, toggleProduceSubscription);

// @route   POST / GET /api/users/:id/reviews
router.route('/:id/reviews')
    .post(protect, createSellerReview)
    .get(getSellerReviews);

// @route   GET /api/users/:id
// This should be last to avoid conflicts with other routes like /profile
router.route('/:id').get(getUserById);

export default router;