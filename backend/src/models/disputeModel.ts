import mongoose from 'mongoose';
import { DisputeStatus, Role } from '../constants';

const disputeConversationItemSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userRole: { type: String, enum: Object.values(Role), required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
}, { _id: false });

const disputeEvidenceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userRole: { type: String, enum: Object.values(Role), required: true },
    imageUrl: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
}, { _id: false });

const disputeSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerName: { type: String, required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  reasonCategory: { type: String, required: true },
  status: { type: String, enum: Object.values(DisputeStatus), default: DisputeStatus.Open },
  resolutionDetails: { type: String },
  orderTotal: { type: Number, required: true },
  conversation: [disputeConversationItemSchema],
  evidence: [disputeEvidenceSchema],
}, {
  timestamps: true,
});

const Dispute = mongoose.model('Dispute', disputeSchema);

export default Dispute;