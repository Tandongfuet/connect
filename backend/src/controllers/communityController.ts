import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import ForumPost from '../models/forumPostModel';
import User from '../models/userModel';
import Notification from '../models/notificationModel';

// @desc    Get all forum posts
// @route   GET /api/community/forum
// @access  Public
const getForumPosts = asyncHandler(async (req: Request, res: Response) => {
    const posts = await ForumPost.find({}).sort({ createdAt: -1 });
    res.json(posts);
});

// @desc    Get a single forum post by ID
// @route   GET /api/community/forum/:id
// @access  Public
const getForumPostById = asyncHandler(async (req: Request, res: Response) => {
    const post = await ForumPost.findById(req.params.id);
    if (post) {
        res.json(post);
    } else {
        res.status(404);
        throw new Error('Post not found');
    }
});

// @desc    Create a forum post
// @route   POST /api/community/forum
// @access  Private
const createForumPost = asyncHandler(async (req: Request, res: Response) => {
    const { title, content, category } = req.body;
    const user = req.user!;
    
    const post = new ForumPost({
        title,
        content,
        category,
        authorId: user._id,
        authorName: user.name,
        authorProfileImage: user.profileImage,
    });
    
    const createdPost = await post.save();
    res.status(201).json(createdPost);
});

// @desc    Create a reply to a forum post
// @route   POST /api/community/forum/:id/reply
// @access  Private
const createForumReply = asyncHandler(async (req: Request, res: Response) => {
    const { content } = req.body;
    const user = req.user!;
    const post = await ForumPost.findById(req.params.id);

    if (post) {
        const reply = {
            content,
            authorId: user._id,
            authorName: user.name,
            authorProfileImage: user.profileImage,
        };
        post.replies.push(reply as any);
        await post.save();

        // Notify post author if they have enabled community updates
        if (post.authorId.toString() !== user._id.toString()) {
             const author = await User.findById(post.authorId);
             if (author && author.notificationPreferences?.communityUpdates) {
                 await Notification.create({
                     userId: author._id,
                     message: `${user.name} replied to your post: "${post.title}"`,
                     type: 'General',
                     link: `/community/forum/${post._id}`,
                     isRead: false
                 });
             }
        }

        res.status(201).json(post);
    } else {
        res.status(404);
        throw new Error('Post not found');
    }
});

// @desc    Toggle like on a post or reply
// @route   PUT /api/community/forum/like/:contentId
// @access  Private
const toggleLike = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.body; // 'post' or 'reply'
    const userId = req.user!._id;
    const { contentId } = req.params;

    if (type === 'post') {
        const post = await ForumPost.findById(contentId);
        if (post) {
            const index = post.likes.indexOf(userId);
            if (index > -1) {
                post.likes.splice(index, 1);
            } else {
                post.likes.push(userId);
            }
            await post.save();
            res.json({ message: 'Like toggled' });
        } else {
            res.status(404);
            throw new Error('Post not found');
        }
    } else if (type === 'reply') {
        const post = await ForumPost.findOne({ 'replies._id': contentId });
        if (post) {
            const reply = post.replies.id(contentId);
            if (reply) {
                const index = reply.likes.indexOf(userId);
                if (index > -1) {
                    reply.likes.splice(index, 1);
                } else {
                    reply.likes.push(userId);
                }
                await post.save();
                res.json({ message: 'Like toggled' });
            } else {
                res.status(404);
                throw new Error('Reply not found');
            }
        } else {
             res.status(404);
             throw new Error('Content not found');
        }
    } else {
        res.status(400);
        throw new Error('Invalid content type');
    }
});

export { getForumPosts, getForumPostById, createForumPost, createForumReply, toggleLike };