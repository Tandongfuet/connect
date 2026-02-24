import mongoose from 'mongoose';

const forumReplySchema = new mongoose.Schema({
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    authorProfileImage: { type: String },
    content: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isFlagged: { type: Boolean, default: false },
}, { timestamps: true });

const forumPostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    authorProfileImage: { type: String },
    content: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies: [forumReplySchema],
    isFlagged: { type: Boolean, default: false },
    isResolved: { type: Boolean, default: false },
}, {
  timestamps: true,
});

const ForumPost = mongoose.model('ForumPost', forumPostSchema);

export default ForumPost;