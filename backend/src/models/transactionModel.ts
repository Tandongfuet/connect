import mongoose from 'mongoose';
import { TransactionType, TransactionStatus } from '../constants';

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  type: { type: String, enum: Object.values(TransactionType), required: true },
  amount: { type: Number, required: true }, // Can be positive (deposit, sale) or negative (withdrawal, purchase)
  status: { type: String, enum: Object.values(TransactionStatus), default: TransactionStatus.Completed },
  description: { type: String, required: true },
  metadata: {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    provider: { type: String }, // e.g., 'MTN Mobile Money'
    phoneNumber: { type: String },
    verifiedAccountHolder: { type: String },
    transferPeer: { type: String },
  },
}, {
  timestamps: { createdAt: 'date' } // Use 'date' to match frontend type
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;