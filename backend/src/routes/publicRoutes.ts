import express from 'express';
import { getEvents, getBadges, getTestimonials, globalSearch, submitContact } from '../controllers/publicController';

const router = express.Router();

router.get('/events', getEvents);
router.get('/badges', getBadges);
router.get('/testimonials', getTestimonials);
router.get('/search', globalSearch);
router.post('/contact', submitContact);

export default router;