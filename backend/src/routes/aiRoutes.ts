import express from 'express';
import { 
    generateArticle, 
    getGrowthAdvice,
    getSemanticKeywords,
    getPriceSuggestion,
    generateTags,
    generateListingContent,
    getAgroBotResponse,
    getRecipeFromIngredients,
    generateMarketingText,
    askAboutArticle,
    performOcr
} from '../controllers/aiController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Admin only
router.post('/generate-article', protect, admin, generateArticle);
router.post('/ocr', protect, admin, performOcr);

// Protected (all logged-in users)
router.get('/growth-advice', protect, getGrowthAdvice);
router.post('/price-suggestion', protect, getPriceSuggestion);
router.post('/generate-tags', protect, generateTags);
router.post('/generate-listing-content', protect, generateListingContent);
router.post('/agrobot', protect, getAgroBotResponse);
router.post('/recipe', protect, getRecipeFromIngredients);
router.post('/marketing-text', protect, generateMarketingText);
router.post('/ask-article', protect, askAboutArticle);

// Public (no auth needed)
router.post('/semantic-keywords', getSemanticKeywords);

export default router;