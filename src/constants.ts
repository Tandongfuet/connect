
export enum Role {
  Admin = 'Admin',
  Buyer = 'Buyer',
  Farmer = 'Farmer',
  ServiceProvider = 'Service Provider',
  SupportAgent = 'Support Agent',
}

export enum ListingStatus {
  Active = 'Active',
  Pending = 'Pending',
  Rejected = 'Rejected',
  Sold = 'Sold',
}

export enum ImageStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export enum TransactionType {
  Deposit = 'Deposit',
  Withdrawal = 'Withdrawal',
  Purchase = 'Purchase',
  Sale = 'Sale',
  Refund = 'Refund',
  Grant = 'Grant',
  Commission = 'Commission',
  Transfer = 'Transfer',
}

export enum TransactionStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Failed = 'Failed',
}

export enum VerificationStatus {
  NotSubmitted = 'Not Submitted',
  Pending = 'Pending',
  Verified = 'Verified',
  Rejected = 'Rejected',
}

export enum VerificationTier {
  None = 'None',
  Bronze = 'Bronze',
  Silver = 'Silver',
  Gold = 'Gold',
}

export enum OrderStatus {
  PendingPayment = 'Pending Payment',
  Processing = 'Processing',
  Shipped = 'Shipped',
  Delivered = 'Delivered',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Disputed = 'Disputed',
}

export enum BookingStatus {
    Pending = 'Pending',
    Confirmed = 'Confirmed',
    AwaitingPayment = 'Awaiting Payment',
    Processing = 'Processing',
    AwaitingCompletion = 'Awaiting Completion',
    Completed = 'Completed',
    Cancelled = 'Cancelled',
    Disputed = 'Disputed',
}

export enum DisputeStatus {
  Open = 'Open',
  UnderReview = 'Under Review',
  Escalated = 'Escalated',
  Resolved = 'Resolved',
  Refunded = 'Refunded',
}

export enum PaymentProvider {
  MTN = 'MTN Mobile Money',
  Orange = 'Orange Money',
  PayPal = 'PayPal',
}

export const DISPUTE_REASONS = [
    'Item not received',
    'Item not as described',
    'Service not rendered as agreed',
    'Billing issue',
    'Other',
];
