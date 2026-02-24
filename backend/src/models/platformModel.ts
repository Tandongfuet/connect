import mongoose, { Document, Model } from 'mongoose';

interface IPlatform extends Document {
  escrowBalance: number;
  commissionBalance: number;
}

interface IPlatformModel extends Model<IPlatform> {
  getSettings(): Promise<IPlatform>;
}

const platformSchema = new mongoose.Schema({
  escrowBalance: { type: Number, default: 0 },
  commissionBalance: { type: Number, default: 0 },
  // Add other global settings here in the future
}, {
  timestamps: true,
});

// Create a singleton model
// This ensures we only ever have one document for platform settings
platformSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

const Platform = mongoose.model<IPlatform, IPlatformModel>('Platform', platformSchema);

export default Platform;