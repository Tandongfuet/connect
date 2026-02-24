import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Article from '../models/articleModel';

// @desc    Get all articles
// @route   GET /api/community/articles
// @access  Public
const getArticles = asyncHandler(async (req: Request, res: Response) => {
    const articles = await Article.find({}).sort({ createdAt: -1 });
    res.json(articles);
});

// @desc    Get article by ID
// @route   GET /api/community/articles/:id
// @access  Public
const getArticleById = asyncHandler(async (req: Request, res: Response) => {
    const article = await Article.findById(req.params.id);
    if (article) {
        res.json(article);
    } else {
        res.status(404);
        throw new Error('Article not found');
    }
});

// @desc    Create an article
// @route   POST /api/community/articles
// @access  Private/Admin
const createArticle = asyncHandler(async (req: Request, res: Response) => {
    const { title, category, content, featuredImage, tags } = req.body;
    const article = new Article({
        title,
        category,
        content,
        featuredImage,
        tags,
        authorId: req.user!._id,
        authorName: req.user!.name,
    });
    const createdArticle = await article.save();
    res.status(201).json(createdArticle);
});

// @desc    Update an article
// @route   PUT /api/community/articles/:id
// @access  Private/Admin
const updateArticle = asyncHandler(async (req: Request, res: Response) => {
    const { title, category, content, featuredImage, tags } = req.body;
    const article = await Article.findById(req.params.id);

    if (article) {
        article.title = title || article.title;
        article.category = category || article.category;
        article.content = content || article.content;
        article.featuredImage = featuredImage || article.featuredImage;
        article.tags = tags || article.tags;
        const updatedArticle = await article.save();
        res.json(updatedArticle);
    } else {
        res.status(404);
        throw new Error('Article not found');
    }
});

// @desc    Delete an article
// @route   DELETE /api/community/articles/:id
// @access  Private/Admin
const deleteArticle = asyncHandler(async (req: Request, res: Response) => {
    const article = await Article.findById(req.params.id);
    if (article) {
        await article.deleteOne();
        res.json({ message: 'Article removed' });
    } else {
        res.status(404);
        throw new Error('Article not found');
    }
});

export { getArticles, getArticleById, createArticle, updateArticle, deleteArticle };