// backend/src/models/securityAlertModel.ts
import mongoose from 'mongoose';

const securityAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    enum: ['Failed Login', 'Flagged Listing', 'Unusual Activity'], 
    required: true 
  },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'timestamp' }
});

const SecurityAlert = mongoose.model('SecurityAlert', securityAlertSchema);

export default SecurityAlert;