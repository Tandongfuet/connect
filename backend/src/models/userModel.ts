import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Role, VerificationStatus, VerificationTier } from '../constants';

export interface UserDocument extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  profileImage?: string;
  accountBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  status: 'Active' | 'Suspended';
  verificationStatus: VerificationStatus;
  verificationTier: VerificationTier;
  phoneNumber?: string;
  location?: string;
  hasReceivedSupportGrant: boolean;
  hasSeenGrantToast: boolean;
  nationalIdNumber?: string;
  businessRegistrationNumber?: string;
  nationalIdImages: string[];
  sellerReviewCount: number;
  averageSellerRating: number;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  savedArticleIds: mongoose.Types.ObjectId[];
  badges: string[];
  wishlist: mongoose.Types.ObjectId[];
  taskProgress: Map<string, string>;
  produceSubscriptions: {
    planting: string[];
    harvest: string[];
  };
  notificationPreferences?: {
    newMessages: boolean;
    orderUpdates: boolean;
    communityUpdates: boolean;
  };
  isFirstLogin: boolean;
  matchPassword: (password: string) => Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: Object.values(Role), required: true },
  profileImage: { type: String },
  accountBalance: { type: Number, default: 0 },
  pendingBalance: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
  verificationStatus: { type: String, enum: Object.values(VerificationStatus), default: VerificationStatus.NotSubmitted },
  verificationTier: { type: String, enum: Object.values(VerificationTier), default: VerificationTier.None },
  phoneNumber: { type: String },
  location: { type: String },
  hasReceivedSupportGrant: { type: Boolean, default: false },
  hasSeenGrantToast: { type: Boolean, default: false },
  nationalIdNumber: { type: String },
  businessRegistrationNumber: { type: String },
  nationalIdImages: [{ type: String }],
  sellerReviewCount: { type: Number, default: 0 },
  averageSellerRating: { type: Number, default: 0 },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedArticleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  badges: [{ type: String }], 
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  taskProgress: { type: Map, of: String, default: {} },
  produceSubscriptions: {
      planting: [{ type: String }],
      harvest: [{ type: String }]
  },
  notificationPreferences: {
    newMessages: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    communityUpdates: { type: Boolean, default: true },
  },
  isFirstLogin: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre<UserDocument>('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model<UserDocument>('User', userSchema);

export default User;