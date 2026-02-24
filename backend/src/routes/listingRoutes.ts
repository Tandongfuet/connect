import express from 'express';
import { 
    getListings, 
    getListingById, 
    createListing, 
    updateListing, 
    deleteListing,
    getListingsBySeller,
    createListingReview,
    getListingReviews
} from '../controllers/listingController';
import { protect, seller } from '../middleware/authMiddleware';

const router = express.Router();

// @route   GET /api/listings
router.route('/').get(getListings).post(protect, seller, createListing);

// @route   GET /api/listings/seller/:sellerId
router.route('/seller/:sellerId').get(getListingsBySeller);

// @route   POST / GET /api/listings/:id/reviews
router.route('/:id/reviews').post(protect, createListingReview).get(getListingReviews);

// @route   GET, PUT, DELETE /api/listings/:id
router
    .route('/:id')
    .get(getListingById)
    .put(protect, updateListing)
    .delete(protect, deleteListing);

export default router;