import express from 'express';
import articleRoutes from './articleRoutes';
import forumRoutes from './forumRoutes';

const router = express.Router();

// Nest the specific community routes
router.use('/articles', articleRoutes);
router.use('/forum', forumRoutes);

export default router;