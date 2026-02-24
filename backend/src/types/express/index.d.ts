import { Document, Types } from 'mongoose';
import { Role, VerificationStatus, VerificationTier } from '../../constants';

// This interface should match the structure of the Mongoose User document
// to ensure type safety in controllers and middleware.
interface IUserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: Role;
  status: 'Active' | 'Suspended';
  verificationStatus: VerificationStatus;
  verificationTier: VerificationTier;
  profileImage?: string;
  accountBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  phoneNumber?: string;
  location?: string;
  businessRegistrationNumber?: string;
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
  // Add other user fields as needed
  matchPassword: (password: string) => Promise<boolean>;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}