import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel';
import Testimonial from '../models/testimonialModel';
import Listing from '../models/listingModel';
import ForumPost from '../models/forumPostModel';
import Booking from '../models/bookingModel';
import Dispute from '../models/disputeModel';
import Session from '../models/sessionModel';

dotenv.config();

const connect = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in environment');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI as string);
};

const clear = async () => {
  try {
    await connect();

    // Remove obvious test users (emails containing 'test' or flag isTestUser)
    const userResult = await User.deleteMany({
      $or: [
        { email: /test/i },
        { email: /example.com/i },
        { isTestUser: true },
        { id: /user_test|user_176005|user_176005638/ }
      ]
    });

    // Remove seeded testimonials by author names used in seeder
    const testimonialResult = await Testimonial.deleteMany({
      author: /Fatima|Samuel|Lydia|Testimonial/i
    });

    // Remove mock listings and forum posts often used for testing
    const listingResult = await Listing.deleteMany({ title: /test|mock/i });
    const forumResult = await ForumPost.deleteMany({ title: /test|mock/i });

    // Remove test bookings, disputes, and sessions
    const bookingResult = await Booking.deleteMany({});
    const disputeResult = await Dispute.deleteMany({});
    const sessionResult = await Session.deleteMany({});

    console.log('Clear Test Data Results:');
    console.log('Users deleted:', userResult.deletedCount);
    console.log('Testimonials deleted:', testimonialResult.deletedCount);
    console.log('Listings deleted:', listingResult.deletedCount);
    console.log('Forum posts deleted:', forumResult.deletedCount);
    console.log('Bookings deleted:', bookingResult.deletedCount);
    console.log('Disputes deleted:', disputeResult.deletedCount);
    console.log('Sessions deleted:', sessionResult.deletedCount);

    await mongoose.disconnect();
    console.log('Done. Database cleaned (check logs above).');
    process.exit(0);
  } catch (err: any) {
    console.error('Error clearing test data:', err);
    process.exit(2);
  }
};

clear();
