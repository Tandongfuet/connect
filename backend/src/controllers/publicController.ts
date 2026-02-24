import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Event from '../models/eventModel';
import Badge from '../models/badgeModel';
import Testimonial from '../models/testimonialModel';
import Listing from '../models/listingModel';
import User from '../models/userModel';
import Article from '../models/articleModel';
import { sendEmail } from '../services/emailService';

// @desc    Get all events
// @route   GET /api/public/events
// @access  Public
const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const events = await Event.find({}).sort({ date: 1 });
  res.json(events);
});

// @desc    Get all badges
// @route   GET /api/public/badges
// @access  Public
const getBadges = asyncHandler(async (req: Request, res: Response) => {
  const badges = await Badge.find({});
  res.json(badges);
});

// @desc    Get all testimonials
// @route   GET /api/public/testimonials
// @access  Public
const getTestimonials = asyncHandler(async (req: Request, res: Response) => {
  const testimonials = await Testimonial.find({});
  res.json(testimonials);
});


// @desc    Global search across listings/users/articles
// @route   GET /api/public/search?q=...
// @access  Public
const globalSearch = asyncHandler(async (req: any, res: any) => {
  const q = (req.query.q as string) || '';
  if (!q) return res.json({ listings: [], users: [], articles: [] });
  const regex = new RegExp(q, 'i');
  const listings = await Listing.find({
    $or: [{ title: regex }, { description: regex }]
  }).limit(20);
  const users = await User.find({ name: regex }).select('name profileImage location').limit(20);
  const articles = await Article.find({
    $or: [{ title: regex }, { content: regex }]
  }).limit(20);
  res.json({ listings, users, articles });
});

// @desc    Submit contact form
// @route   POST /api/public/contact
// @access  Public
const submitContact = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, message } = req.body;
  // log and send email to site admin
  console.log('Contact form received:', req.body);
  try {
    await sendEmail('admin@agroconnect.cm', `Contact from ${name}`, `Email: ${email}<br/><br/>${message}`);
  } catch (err) {
    console.warn('Failed to send contact email', err);
  }
  res.json({ success: true });
});

export { getEvents, getBadges, getTestimonials, globalSearch, submitContact };