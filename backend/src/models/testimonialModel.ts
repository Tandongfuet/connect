import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  author: { type: String, required: true },
  location: { type: String, required: true },
  quote: { type: String, required: true },
  rating: { type: Number, required: true },
  videoUrl: { type: String },
});

const Testimonial = mongoose.model('Testimonial', testimonialSchema);
export default Testimonial;