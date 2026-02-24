import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfile, verifyPassword } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// @route   POST /api/users/register
router.post('/register', registerUser);

// @route   POST /api/users/login
router.post('/login', loginUser);

// @route   GET & PUT /api/users/profile
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// @route   POST /api/users/verify-password
router.post('/verify-password', protect, verifyPassword);

export default router;