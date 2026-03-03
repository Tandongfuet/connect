import Testimonial from './models/testimonialModel';

// simple seeder for initial testimonials data
export const seedTestimonials = async () => {
  try {
    const count = await Testimonial.countDocuments();
    if (count === 0) {
      await Testimonial.insertMany([
        {
          author: 'Fatima Ngassa',
          location: 'Bamenda',
          quote: 'AgroConnect helped me sell my cassava quickly and reach buyers across regions!',
          rating: 5,
        },
        {
          author: 'Samuel Eko',
          location: 'Douala',
          quote: 'The platform makes it easy to connect with buyers and the escrow system gives me peace of mind.',
          rating: 4,
        },
        {
          author: 'Lydia T',
          location: 'Yaoundé',
          quote: 'I love how simple and reliable AgroConnect is. My produce moves faster now.',
          rating: 5,
          videoUrl: 'https://example.com/video/testimonial3.mp4',
        },
      ]);
      console.log('🔁 Sample testimonials seeded into database');
    }
  } catch (error) {
    console.error('Error seeding testimonials:', error);
  }
};
