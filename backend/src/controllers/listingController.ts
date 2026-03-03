
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Listing from '../models/listingModel';
import { ListingStatus, VerificationStatus } from '../constants';

/**
 * @desc    Fetch all active listings
 * @route   GET /api/listings
 * @access  Public
 */
const getListings = asyncHandler(async (req: Request, res: Response) => {
  const listings = await Listing.find({ status: ListingStatus.Active }).sort({ createdAt: -1 });
  res.json(listings);
});

/**
 * @desc    Fetch single listing
 * @route   GET /api/listings/:id
 * @access  Public
 */
const getListingById = asyncHandler(async (req: Request, res: Response) => {
  const listing = await Listing.findById(req.params.id);
  if (listing) {
    res.json(listing);
  } else {
    res.status(404);
    throw new Error('Listing not found');
  }
});

/**
 * @desc    Fetch listings for a specific seller
 * @route   GET /api/listings/seller/:sellerId
 * @access  Public
 */
const getListingsBySeller = asyncHandler(async (req: Request, res: Response) => {
    const listings = await Listing.find({ 'seller.id': req.params.sellerId });
    res.json(listings);
});


/**
 * @desc    Create a new listing
 * @route   POST /api/listings
 * @access  Private (Sellers)
 */
const createListing = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, price, category, stock, isService, isBulk, images, tieredPricing, promoVideoUrl } = req.body;
  const user = req.user!;

  const isVerified = user.verificationStatus === VerificationStatus.Verified;
  const newStatus = isVerified ? ListingStatus.Active : ListingStatus.Pending;

  if (!isService && (stock === undefined || stock < 0)) {
      res.status(400);
      throw new Error('Stock cannot be negative for physical products');
  }

  const listing = new Listing({
    title,
    description,
    price,
    category,
    stock: isService ? 0 : stock,
    isService,
    isBulk,
    images,
    tieredPricing: isBulk ? tieredPricing : [],
    promoVideoUrl,
    status: newStatus,
    seller: {
        id: user._id,
        name: user.name,
        profileImage: user.profileImage,
        location: user.location,
        verificationTier: user.verificationTier,
        // These fields are denormalized from the User model
        // averageSellerRating: user.averageSellerRating, 
        // sellerReviewCount: user.sellerReviewCount,
    }
  });

  const createdListing = await listing.save();
  res.status(201).json(createdListing);
});

/**
 * @desc    Update a listing
 * @route   PUT /api/listings/:id
 * @access  Private (Owner or Admin)
 */
const updateListing = asyncHandler(async (req: Request, res: Response) => {
    const { title, description, price, category, stock, isService, isBulk, images, tieredPricing, status, promoVideoUrl } = req.body;
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
        res.status(404);
        throw new Error('Listing not found');
    }

    // Check if the user is the owner of the listing or an admin
    if (!listing.seller || (listing.seller.id.toString() !== req.user!._id.toString() && req.user!.role !== 'Admin')) {
        res.status(401);
        throw new Error('User not authorized to update this listing');
    }

    if (stock !== undefined && stock < 0) {
        res.status(400);
        throw new Error('Stock cannot be negative');
    }

    listing.title = title || listing.title;
    listing.description = description || listing.description;
    listing.price = price ?? listing.price;
    listing.category = category || listing.category;
    listing.stock = stock ?? listing.stock;
    listing.isService = isService ?? listing.isService;
    listing.isBulk = isBulk ?? listing.isBulk;
    listing.images = images || listing.images;
    listing.tieredPricing = tieredPricing || listing.tieredPricing;
    listing.promoVideoUrl = promoVideoUrl || listing.promoVideoUrl;
    // Only admins should change status directly
    if (req.user!.role === 'Admin' && status) {
        listing.status = status;
    } else if (req.user!.role !== 'Admin') {
        // If a seller edits, it should go back to pending unless they are verified
        const isVerified = req.user!.verificationStatus === VerificationStatus.Verified;
        listing.status = isVerified ? ListingStatus.Active : ListingStatus.Pending;
    }
    
    const updatedListing = await listing.save();
    res.json(updatedListing);
});

/**
 * @desc    Delete a listing
 * @route   DELETE /api/listings/:id
 * @access  Private (Owner or Admin)
 */
const deleteListing = asyncHandler(async (req: Request, res: Response) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        res.status(404);
        throw new Error('Listing not found');
    }

    if (!listing.seller || (listing.seller.id.toString() !== req.user!._id.toString() && req.user!.role !== 'Admin')) {
        res.status(401);
        throw new Error('User not authorized to delete this listing');
    }

    await listing.deleteOne();
    res.json({ message: 'Listing removed' });
});

/**
 * @desc    Create a review for a listing
 * @route   POST /api/listings/:id/reviews
 * @access  Private
 */
const createListingReview = asyncHandler(async (req: Request, res: Response) => {
    const { rating, comment } = req.body;
    const listing = await Listing.findById(req.params.id);

    if (listing) {
        // In a real app, enforce that user has bought the item before reviewing
        
        const review = {
            userId: req.user!._id,
            userName: req.user!.name,
            userProfileImage: req.user!.profileImage,
            rating: Number(rating),
            comment,
        };

        listing.reviews.push(review as any);

        listing.reviewCount = listing.reviews.length;
        listing.averageRating = listing.reviews.reduce((acc, item) => item.rating + acc, 0) / listing.reviews.length;

        await listing.save();
        res.status(201).json({ message: 'Review added' });
    } else {
        res.status(404);
        throw new Error('Listing not found');
    }
});

/**
 * @desc    Get reviews for a listing
 * @route   GET /api/listings/:id/reviews
 * @access  Public
 */
const getListingReviews = asyncHandler(async (req: Request, res: Response) => {
    const listing = await Listing.findById(req.params.id);
    if (listing) {
        res.json(listing.reviews);
    } else {
        res.status(404);
        throw new Error('Listing not found');
    }
});


export { getListings, getListingById, getListingsBySeller, createListing, updateListing, deleteListing, createListingReview, getListingReviews };