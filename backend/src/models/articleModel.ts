import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true },
    featuredImage: { type: String, required: true },
    tags: [{ type: String }],
}, {
  timestamps: true,
});

const Article = mongoose.model('Article', articleSchema);

export default Article;