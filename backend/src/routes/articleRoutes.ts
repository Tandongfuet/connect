import express from 'express';
import { protect, admin } from '../middleware/authMiddleware';
import { getArticles, getArticleById, createArticle, updateArticle, deleteArticle } from '../controllers/articleController';

const router = express.Router();

router.route('/').get(getArticles).post(protect, admin, createArticle);
router.route('/:id').get(getArticleById).put(protect, admin, updateArticle).delete(protect, admin, deleteArticle);

export default router;