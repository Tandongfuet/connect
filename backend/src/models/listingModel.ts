import mongoose from 'mongoose';
import { ListingStatus, ImageStatus, VerificationTier } from '../constants';

const tieredPriceSchema = new mongoose.Schema({
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
}, { _id: false });

const listingImageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    status: { type: String, enum: Object.values(ImageStatus), default: ImageStatus.Pending },
}, { _id: false });

const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userProfileImage: { type: String },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
}, { timestamps: true });

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  stock: { type: Number },
  isService: { type: Boolean, default: false },
  isBulk: { type: Boolean, default: false },
  images: [listingImageSchema],
  seller: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    profileImage: { type: String },
    location: { type: String },
    verificationTier: { type: String, enum: Object.values(VerificationTier) },
    averageSellerRating: { type: Number },
    sellerReviewCount: { type: Number },
  },
  status: { type: String, enum: Object.values(ListingStatus), default: ListingStatus.Pending },
  tieredPricing: [tieredPriceSchema],
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  promoVideoUrl: { type: String },
}, {
  timestamps: true,
});

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;