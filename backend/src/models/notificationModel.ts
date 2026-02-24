import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['New Inquiry', 'New Booking', 'Listing Approved', 'Security Alert', 'General'], 
    required: true 
  },
  link: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  isAI: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'timestamp' } // Use 'timestamp' to match frontend type
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;