import mongoose from 'mongoose';

const flaggedContentSchema = new mongoose.Schema({
    contentType: { type: String, enum: ['post', 'reply', 'user'], required: true },
    contentId: { type: String, required: true },
    contentPreview: { type: String, required: true },
    reason: { type: String, required: true },
    reportedBy: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        isAI: { type: Boolean, default: false },
    },
    isResolved: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'timestamp' }
});

const FlaggedContent = mongoose.model('FlaggedContent', flaggedContentSchema);

export default FlaggedContent;