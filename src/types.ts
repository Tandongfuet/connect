import { Role, ListingStatus, ImageStatus, TransactionType, TransactionStatus, VerificationTier, OrderStatus, DisputeStatus, BookingStatus, VerificationStatus } from './constants';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  organizer: string;
  link?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  role: Role;
  createdAt: string;
  accountBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  status: 'Active' | 'Suspended';
  verificationStatus: VerificationStatus;
  verificationTier: VerificationTier;
  phoneNumber?: string;
  location?: string;
  hasReceivedSupportGrant?: boolean;
  nationalIdNumber?: string;
  businessRegistrationNumber?: string;
  nationalIdImages?: string[];
  sellerReviewCount: number;
  averageSellerRating: number;
  isTestUser?: boolean;
  savedArticleIds: string[];
  taskProgress?: { [taskId: string]: 'Done' | 'Skipped' };
  followers: string[]; // userIds
  // Added followerCount property
  followerCount: number;
  following: string[]; // userIds
  notificationPreferences?: {
    newMessages: boolean;
    orderUpdates: boolean;
    communityUpdates: boolean;
  };
  badges: string[]; // badge IDs
  wishlist: string[]; // listingIds
  hasSeenGrantToast?: boolean;
  isFirstLogin?: boolean;
}

export interface ListingImage {
  url: string;
  status: ImageStatus;
}

export interface TieredPrice {
  quantity: number;
  price: number;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  stock?: number;
  isService: boolean;
  isBulk?: boolean;
  images: ListingImage[];
  seller: {
    id: string;
    name: string;
    profileImage?: string;
    location?: string;
    verificationTier: VerificationTier;
    averageSellerRating: number;
    sellerReviewCount: number;
  };
  createdAt: string;
  status: ListingStatus;
  tieredPricing?: TieredPrice[];
  averageRating?: number;
  reviewCount?: number;
  reviews?: Review[];
  promoVideoUrl?: string;
}

export interface CartItem {
  listing: {
    id: string;
    title: string;
    price: number;
    image: string; // URL of the first image
    stock?: number;
    isService: boolean;
    seller: {
      id: string;
      name: string;
    };
  };
  quantity: number;
}

export interface TrackingEvent {
    date: string;
    status: string;
    location: string;
}

export interface SellerOrder {
  sellerId: string;
  sellerName: string;
  items: CartItem[];
  subTotal: number;
  status: OrderStatus;
  trackingHistory: TrackingEvent[];
  isReviewed: boolean;
}

export interface Order {
  id: string;
  buyerInfo: { id: string; name: string };
  sellerOrders: SellerOrder[];
  totalPrice: number;
  createdAt: string;
  deliveryMethod: string;
  deliveryCost: number;
  estimatedDeliveryDate: string;
}


export interface Review {
  id: string;
  listingId: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SellerReview {
  id: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}


export interface Booking {
  id: string;
  serviceId: string;
  serviceTitle: string;
  providerId: string;
  userId: string;
  userName: string;
  bookingDate: string;
  status: BookingStatus;
  createdAt: string;
  price: number; // Price is locked in at time of booking
  isReviewed: boolean;
  category: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'New Inquiry' | 'New Booking' | 'Listing Approved' | 'Security Alert' | 'General';
  link: string;
  isRead: boolean;
  timestamp: string;
  isAI?: boolean; // To identify AI-generated notifications
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  userName?: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  date: string;
  metadata?: {
    orderId?: string;
    bookingId?: string;
    provider?: string;
    phoneNumber?: string;
    verifiedAccountHolder?: string;
    transferPeer?: string; // e.g. "To/From John Doe"
  };
}

export interface DisputeConversationItem {
    userId: string;
    userName: string;
    userRole: Role;
    message: string;
    timestamp: string;
}

export interface DisputeEvidence {
    userId: string;
    userName: string;
    userRole: Role;
    imageUrl: string;
    timestamp: string;
}

export interface Dispute {
  id: string;
  orderId?: string;
  order?: Order;
  bookingId?: string;
  booking?: Booking;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  seller?: User;
  reason: string;
  reasonCategory: string;
  status: DisputeStatus;
  resolutionDetails?: string;
  orderTotal: number;
  createdAt: string;
  conversation: DisputeConversationItem[];
  evidence: DisputeEvidence[];
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  type: 'Failed Login' | 'Flagged Listing' | 'Unusual Activity';
  message: string;
  isRead: boolean;
  userId?: string;
  listingId?: string;
}

export interface ProduceSubscription {
    planting: string[];
    harvest: string[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  timestamp: string;
  details?: string;
}

export interface Session {
    id: string;
    userId: string;
    ipAddress: string;
    userAgent: string;
    loginTime: string;
}

// --- New Community Features ---

export interface ForumReply {
    id: string;
    authorId: string;
    authorName: string;
    authorProfileImage?: string;
    content: string;
    createdAt: string;
    likes: string[]; // Set of userIds who liked
    isFlagged: boolean;
}

export interface ForumPost {
    id: string;
    title: string;
    category: string;
    authorId: string;
    authorName: string;
    authorProfileImage?: string;
    createdAt: string;
    content: string;
    likes: string[]; // Set of userIds who liked
    replies: ForumReply[];
    isFlagged: boolean;
    isResolved?: boolean;
}

export interface Article {
    id: string;
    title: string;
    category: string;
    authorId: string; // Admin who posted
    authorName: string;
    createdAt: string;
    content: string; // Markdown or rich text content
    featuredImage: string;
    tags: string[];
}

export interface Testimonial {
  id: string;
  author: string;
  location: string;
  quote: string;
  rating: number;
}


export interface FlaggedContent {
    id: string;
    contentType: 'post' | 'reply' | 'user';
    contentId: string; // ID of ForumPost, ForumReply, or User
    contentPreview: string;
    reason: string;
    reportedBy: { 
        id: string; 
        name: string;
        isAI?: boolean; // New: To identify AI-generated content
    };
    timestamp: string;
    isResolved: boolean;
}

// --- New Moderation Queue Features ---
export interface AITriagedContent extends FlaggedContent {
    priority: 'Low' | 'Medium' | 'Critical';
    suggestedAction: string;
}

export interface CommissionPayout {
  id: string;
  amount: number;
  date: string;
  destination: string;
  transactionId: string;
  adminId: string;
}


// --- New Seasonal Calendar Features ---

export interface WeatherData {
    region: string;
    temperature: number; // in Celsius
    precipitationChance: number; // in %
    conditions: 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy';
}

export interface AgriculturalTask {
    id: string;
    month: number; // 1-12
    region: string;
    crop: string;
    task: string;
    taskType: 'Planting' | 'Tending' | 'Harvesting' | 'Pest Control';
    icon: string;
    details?: {
        dosage?: string;
        timing?: string;
        equipment?: string;
    };
}