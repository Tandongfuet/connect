import mongoose from 'mongoose';
import { BookingStatus } from '../constants';

const bookingSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  serviceTitle: { type: String, required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  bookingDate: { type: Date, required: true },
  status: { type: String, enum: Object.values(BookingStatus), default: BookingStatus.Pending },
  price: { type: Number, required: true },
  isReviewed: { type: Boolean, default: false },
  category: { type: String },
}, {
  timestamps: true,
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;