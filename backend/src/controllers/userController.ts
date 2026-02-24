import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel';
import Listing from '../models/listingModel';
import ForumPost from '../models/forumPostModel';
import SellerReview from '../models/sellerReviewModel';
import Order from '../models/orderModel';
import { ListingStatus } from '../constants';

// @desc    Get all users (for search/directory)
// @route   GET /api/users
// @access  Private
const getUsers = asyncHandler(async (req: Request, res: Response) => {
    // Only return necessary public info
    const users = await User.find({}).select('name email role profileImage location verificationStatus verificationTier');
    res.json(users);
});

// @desc    Get user by ID (public profile)
// @route   GET /api/users/:id
// @access  Public
const getUserById = asyncHandler(async (req: Request, res: Response) => {
    // SECURITY: Explicitly select only public fields.
    // DO NOT return: accountBalance, pendingBalance, nationalIdNumber, nationalIdImages, password, etc.
    const user = await User.findById(req.params.id).select(
        'name email role profileImage location verificationStatus verificationTier sellerReviewCount averageSellerRating badges followerCount following createdAt'
    );

    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Delete own account
// @route   DELETE /api/users/profile
// @access  Private
const deleteSelf = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.user!._id);
    if (user) {
        await user.deleteOne();
        res.json({ message: 'User deleted' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});


// @desc    Follow/unfollow a user
// @route   PUT /api/users/follow/:id
// @access  Private
const toggleFollow = asyncHandler(async (req: Request, res: Response) => {
    const currentUser = req.user!;
    const targetUserId = req.params.id;

    if (currentUser._id.toString() === targetUserId) {
        res.status(400);
        throw new Error("You cannot follow yourself");
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
        res.status(404);
        throw new Error("User not found");
    }
    
    // Check if already following
    const isFollowing = currentUser.following.some(id => id.toString() === targetUserId);

    if (isFollowing) {
        // Unfollow
        currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
        targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUser._id.toString());
    } else {
        // Follow
        currentUser.following.push(targetUser._id as any);
        targetUser.followers.push(currentUser._id as any);
    }

    targetUser.followerCount = targetUser.followers.length;

    await currentUser.save();
    await targetUser.save();

    res.json({ message: 'Follow status updated' });
});

// @desc    Get followers of a user
// @route   GET /api/users/:id/followers
// @access  Public
const getUserFollowers = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id).populate('followers', 'name email role profileImage verificationTier');
    if (user) {
        res.json(user.followers);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get users followed by a user
// @route   GET /api/users/:id/following
// @access  Public
const getUserFollowing = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id).populate('following', 'name email role profileImage verificationTier');
    if (user) {
        res.json(user.following);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get feed for user (activities of people they follow)
// @route   GET /api/users/:id/feed
// @access  Private
const getUserFeed = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    
    // Security check: Ensure user is requesting their own feed
    if (req.user!._id.toString() !== user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to view this feed');
    }

    const followingIds = user.following;

    // Fetch new listings from followed users
    const listings = await Listing.find({ 
        'seller.id': { $in: followingIds },
        status: ListingStatus.Active 
    }).sort({ createdAt: -1 }).limit(10).lean();

    // Fetch forum posts from followed users
    const posts = await ForumPost.find({
        authorId: { $in: followingIds }
    }).sort({ createdAt: -1 }).limit(10).lean();

    // Normalize and combine
    const feed = [
        ...listings.map(l => ({ type: 'new_listing', user: l.seller, content: l, timestamp: l.createdAt })),
        ...posts.map(p => ({ 
            type: 'new_post', 
            user: { id: p.authorId, name: p.authorName, profileImage: p.authorProfileImage }, 
            content: p, 
            timestamp: p.createdAt 
        }))
    ];

    // Sort combined feed by date descending
    feed.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(feed.slice(0, 20));
});


// @desc    Get user's wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.user!._id).populate('wishlist');
    if (user) {
        res.json(user.wishlist);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Add item to wishlist
// @route   POST /api/users/wishlist
// @access  Private
const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
    const { listingId } = req.body;
    const user = req.user!;
    
    if (!user.wishlist.includes(listingId)) {
        user.wishlist.push(listingId);
        await user.save();
    }
    res.status(200).json({ message: 'Added to wishlist' });
});

// @desc    Remove item from wishlist
// @route   DELETE /api/users/wishlist/:listingId
// @access  Private
const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
    const { listingId } = req.params;
    const user = req.user!;

    user.wishlist = user.wishlist.filter(id => id.toString() !== listingId);
    await user.save();
    
    res.status(200).json({ message: 'Removed from wishlist' });
});

// @desc    Update task progress
// @route   PUT /api/users/tasks
// @access  Private
const updateTaskProgress = asyncHandler(async (req: Request, res: Response) => {
    const { taskId, status } = req.body;
    const user = await User.findById(req.user!._id);
    if (user) {
        user.taskProgress.set(taskId, status);
        const updatedUser = await user.save();
        // Return minimal data
        res.json({ taskProgress: updatedUser.taskProgress });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Clear task progress
// @route   DELETE /api/users/tasks/:taskId
// @access  Private
const clearTaskProgress = asyncHandler(async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const user = await User.findById(req.user!._id);
    if (user) {
        if (taskId === 'all') {
             user.taskProgress.clear();
        } else {
             user.taskProgress.delete(taskId);
        }
        const updatedUser = await user.save();
        res.json({ taskProgress: updatedUser.taskProgress });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get produce subscriptions
// @route   GET /api/users/subscriptions
// @access  Private
const getProduceSubscriptions = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.user!._id);
    if (user) {
        res.json(user.produceSubscriptions || { planting: [], harvest: [] });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Toggle produce subscription
// @route   PUT /api/users/subscriptions
// @access  Private
const toggleProduceSubscription = asyncHandler(async (req: Request, res: Response) => {
    const { cropName, type } = req.body; // type: 'planting' | 'harvest'
    const user = await User.findById(req.user!._id);
    
    if (user) {
        if (!user.produceSubscriptions) {
            user.produceSubscriptions = { planting: [], harvest: [] };
        }
        
        const list = user.produceSubscriptions[type as 'planting' | 'harvest'];
        const index = list.indexOf(cropName);
        
        if (index > -1) {
            list.splice(index, 1);
        } else {
            list.push(cropName);
        }
        
        const updatedUser = await user.save();
        res.json(updatedUser.produceSubscriptions);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Create a seller review
// @route   POST /api/users/:id/reviews
// @access  Private
const createSellerReview = asyncHandler(async (req: Request, res: Response) => {
    const { rating, comment, orderId } = req.body;
    const sellerId = req.params.id;
    const buyer = req.user!;

    const seller = await User.findById(sellerId);
    if (!seller) {
        res.status(404);
        throw new Error('Seller not found');
    }

    // Check if order exists and user is the buyer (simplified, assuming frontend passes correct orderId)
    if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
            // Ensure the reviewer is the buyer of the order
            if (order.buyerInfo.id.toString() !== buyer._id.toString()) {
                 res.status(403);
                 throw new Error('Not authorized to review this order');
            }
            
            const sellerOrder = order.sellerOrders.find(so => so.sellerId.toString() === sellerId);
            if (sellerOrder) {
                sellerOrder.isReviewed = true;
                await order.save();
            }
        }
    }

    const review = await SellerReview.create({
        sellerId,
        buyerId: buyer._id,
        buyerName: buyer.name,
        orderId,
        rating,
        comment
    });

    // Update seller stats
    const reviews = await SellerReview.find({ sellerId });
    seller.sellerReviewCount = reviews.length;
    seller.averageSellerRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    
    await seller.save();

    res.status(201).json(review);
});

// @desc    Get seller reviews
// @route   GET /api/users/:id/reviews
// @access  Public
const getSellerReviews = asyncHandler(async (req: Request, res: Response) => {
    const reviews = await SellerReview.find({ sellerId: req.params.id }).sort({ createdAt: -1 });
    res.json(reviews);
});

export { 
    getUsers, 
    getUserById, 
    deleteSelf,
    toggleFollow, 
    getUserFollowers, 
    getUserFollowing,
    getUserFeed,
    getWishlist, 
    addToWishlist, 
    removeFromWishlist,
    updateTaskProgress,
    clearTaskProgress,
    getProduceSubscriptions,
    toggleProduceSubscription,
    createSellerReview,
    getSellerReviews
};