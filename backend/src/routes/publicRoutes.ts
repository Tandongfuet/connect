import express from 'express';
import { getEvents, getBadges, getTestimonials, createTestimonial, globalSearch, submitContact } from '../controllers/publicController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/events', getEvents);
router.get('/badges', getBadges);
router.get('/testimonials', getTestimonials);
router.post('/testimonials', protect, createTestimonial);
router.get('/search', globalSearch);
router.post('/contact', submitContact);

export default router;