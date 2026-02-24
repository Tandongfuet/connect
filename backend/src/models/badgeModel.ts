import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. 'badge_founder'
  name: { type: String, required: true },
  icon: { type: String, required: true },
  description: { type: String, required: true },
});

const Badge = mongoose.model('Badge', badgeSchema);
export default Badge;