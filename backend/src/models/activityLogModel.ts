import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String },
}, {
  timestamps: { createdAt: 'timestamp' }
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;