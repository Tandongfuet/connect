
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getListings, getTestimonials } from '../services/api';

import type { Listing, Testimonial } from '../types';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import BrandIcon from '../components/BrandIcon';
import { Role } from '../constants';
import RecommendedForYou from '../components/RecommendedForYou';
import { useAuth } from '../contexts/AuthContext';
import ProductCarousel from '../components/ProductCarousel';
import SEO from '../components/SEO';
import TestimonialCard from '../components/TestimonialCard';
import BookingModal from '../components/BookingModal';


// New hero image: Golden Hour Harvest Field
const heroImage = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2069&auto=format&fit=crop';


const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [newestListings, setNewestListings] = useState<Listing[]>([]);
  const [trendingListings, setTrendingListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedListingForBooking, setSelectedListingForBooking] = useState<Listing | null>(null);

  const handleBookNow = (listing: Listing) => {
    setSelectedListingForBooking(listing);
    setIsBookingModalOpen(true);
  };

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const allListings = await getListings();
        const activeProducts = allListings.filter(l => !l.isService && l.status === 'Active');
        
        setNewestListings([...activeProducts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8));

        const trending = [...activeProducts].sort((a, b) => {
            const scoreA = (a.averageRating || 0) * (a.reviewCount || 0);
            const scoreB = (b.averageRating || 0) * (b.reviewCount || 0);
            return scoreB - scoreA;
        });
        setTrendingListings(trending.slice(0, 8));

      } catch (err) {
        console.error("Failed to fetch listings", err);
      } finally {
        setLoading(false);
      }
    };
    const fetchTestimonials = async () => {
        try {
            const data = await getTestimonials();
            setTestimonials(data);
        } catch (err) {
            console.error("Failed to fetch testimonials", err);
        } finally {
            setLoadingTestimonials(false);
        }
    };
    fetchListings();
    fetchTestimonials();
  }, []);
  

  return (
    <div className="space-y-20">
      <SEO
        title="AgroConnect | Fresh Produce & Farm Services in Cameroon"
        description="A digital marketplace connecting Cameroonian farmers with buyers. Discover fresh local produce, find agricultural services, and join a thriving community."
        keywords="Cameroon agriculture, fresh produce, local farmers, farm services, buy food online Cameroon, AgroConnect"
      />
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        listing={selectedListingForBooking}
      />
      {/* Hero Section */}
      <section
        className="relative rounded-lg shadow-2xl overflow-hidden -mt-8 bg-cover bg-center flex items-center min-h-[70vh] border-b-4 border-primary"
        style={{ 
            backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7)), url('${heroImage}')` 
        }}
      >
        {/* Content */}
        <div className="relative container mx-auto px-6 py-20 text-center z-10">
            <div className="animate-fade-in-down">
                <BrandIcon className="h-24 w-24 mx-auto text-white drop-shadow-lg" />
                <h2 className="text-xl md:text-2xl font-bold tracking-widest text-primary-light uppercase mt-4 mb-2 drop-shadow-md">
                    AGROCONNECT
                </h2>
                <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-white drop-shadow-xl mb-6">
                    From Farm to Table,<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-white">Seamlessly Connected.</span>
                </h1>
                <div className="max-w-3xl mx-auto bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-white/10 shadow-2xl">
                    <p className="text-lg md:text-2xl font-medium text-white drop-shadow-md leading-relaxed">
                        Discover fresh local produce, find essential agricultural services, and join a thriving community dedicated to sustainable farming in Cameroon.
                    </p>
                </div>
                <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up">
                    <Link to="/products" className="btn btn-light font-bold py-4 px-8 text-lg shadow-lg transform hover:scale-105 transition-transform">
                        Explore Marketplace
                    </Link>
                    <Link to="/register" state={{ defaultRole: Role.Farmer }} className="btn btn-primary font-bold py-4 px-8 text-lg shadow-lg transform hover:scale-105 transition-transform">
                        Become a Seller
                    </Link>
                </div>
            </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-green-50 dark:bg-dark-surface py-20">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-dark dark:text-dark-text">🌱 Simple Steps to Get Started</h2>
              <p className="text-gray-muted dark:text-dark-muted mt-2">Join our network in just a few clicks.</p>
            </div>
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-16 text-center">
              {/* Arrow 1 */}
              <div aria-hidden="true" className="hidden md:block absolute top-8 left-0 w-full h-full">
                  <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                      <path d="M25 10 Q 50 2, 75 10" stroke="#4CAF50" strokeWidth="2.5" fill="none" strokeDasharray="6,6" />
                  </svg>
              </div>
              <div className="relative p-8 bg-white dark:bg-slate-dark rounded-lg shadow-xl z-10 transition-transform duration-300 hover:-translate-y-2">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white rounded-full h-16 w-16 flex items-center justify-center text-3xl font-bold shadow-lg border-4 border-green-50 dark:border-dark-surface">1</div>
                <h3 className="text-xl font-semibold text-slate-dark dark:text-dark-text mt-10 mb-2">Create Your Account</h3>
                <p className="text-gray-muted dark:text-dark-muted">Quickly sign up as a Farmer, Buyer, or Service Provider to join our growing community.</p>
              </div>
              <div className="relative p-8 bg-white dark:bg-slate-dark rounded-lg shadow-xl z-10 transition-transform duration-300 hover:-translate-y-2">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white rounded-full h-16 w-16 flex items-center justify-center text-3xl font-bold shadow-lg border-4 border-green-50 dark:border-dark-surface">2</div>
                <h3 className="text-xl font-semibold text-slate-dark dark:text-dark-text mt-10 mb-2">List or Discover</h3>
                <p className="text-gray-muted dark:text-dark-muted">Farmers list produce, buyers browse the marketplace, and everyone connects through our secure platform.</p>
              </div>
              <div className="relative p-8 bg-white dark:bg-slate-dark rounded-lg shadow-xl z-10 transition-transform duration-300 hover:-translate-y-2">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white rounded-full h-16 w-16 flex items-center justify-center text-3xl font-bold shadow-lg border-4 border-green-50 dark:border-dark-surface">3</div>
                <h3 className="text-xl font-semibold text-slate-dark dark:text-dark-text mt-10 mb-2">Transact Securely</h3>
                <p className="text-gray-muted dark:text-dark-muted">Our escrow system protects every payment. Funds are released only after you confirm your satisfaction.</p>
              </div>
            </div>
        </div>
      </section>
      
      {/* Why Choose Us */}
      <section className="py-20 bg-white dark:bg-dark-surface rounded-lg">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-dark dark:text-dark-text">Why Choose AgroConnect?</h2>
                <p className="text-gray-muted dark:text-dark-muted mt-2 max-w-2xl mx-auto">Connecting communities for a fresher, more sustainable future by empowering every link in the agricultural chain.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-cream-light dark:bg-dark-bg p-8 rounded-xl shadow-lg text-center transition-transform duration-300 hover:-translate-y-2 border-b-4 border-transparent hover:border-primary">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                         <span className="text-4xl">🧑‍🌾</span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-dark dark:text-white mb-2">Direct From The Source</h3>
                    <p className="text-gray-muted dark:text-dark-muted">Get the freshest produce directly from local Cameroonian farmers, ensuring quality and transparency.</p>
                </div>
                <div className="bg-cream-light dark:bg-dark-bg p-8 rounded-xl shadow-lg text-center transition-transform duration-300 hover:-translate-y-2 border-b-4 border-transparent hover:border-accent">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-6">
                        <span className="text-4xl">❤️</span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-dark dark:text-white mb-2">Empower Local Communities</h3>
                    <p className="text-gray-muted dark:text-dark-muted">Your purchases directly support smallholder farmers, boosting the local economy and fostering sustainability.</p>
                </div>
                <div className="bg-cream-light dark:bg-dark-bg p-8 rounded-xl shadow-lg text-center transition-transform duration-300 hover:-translate-y-2 border-b-4 border-transparent hover:border-primary">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
                        <span className="text-4xl">🛠️</span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-dark dark:text-white mb-2">Find Trusted Services</h3>
                    <p className="text-gray-muted dark:text-dark-muted">Connect with reliable providers for everything from soil testing to equipment rental, all in one place.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Our Impact Section */}
      <section className="bg-gradient-to-br from-green-100 to-primary-light dark:from-dark-surface dark:to-slate-dark py-20 rounded-lg">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-slate-dark dark:text-dark-text mb-12">Our Impact, Your Success</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-white/50 dark:bg-dark-surface/50 backdrop-blur-sm p-6 rounded-xl shadow-lg transition-transform hover:scale-105 border border-white/20">
                <span className="text-5xl font-extrabold text-primary-dark">🧑‍🌾</span>
                <p className="text-4xl font-bold text-slate-dark dark:text-white mt-2">500+</p>
                <p className="text-gray-muted dark:text-dark-muted mt-1 font-semibold">Farmers Empowered</p>
            </div>
            <div className="bg-white/50 dark:bg-dark-surface/50 backdrop-blur-sm p-6 rounded-xl shadow-lg transition-transform hover:scale-105 border border-white/20">
                <span className="text-5xl font-extrabold text-primary-dark">🌿</span>
                <p className="text-4xl font-bold text-slate-dark dark:text-white mt-2">10,000+ kg</p>
                <p className="text-gray-muted dark:text-dark-muted mt-1 font-semibold">Of Produce Sold</p>
            </div>
            <div className="bg-white/50 dark:bg-dark-surface/50 backdrop-blur-sm p-6 rounded-xl shadow-lg transition-transform hover:scale-105 border border-white/20">
                <span className="text-5xl font-extrabold text-primary-dark">📍</span>
                <p className="text-4xl font-bold text-slate-dark dark:text-white mt-2">10</p>
                <p className="text-gray-muted dark:text-dark-muted mt-1 font-semibold">Regions Connected</p>
            </div>
            <div className="bg-white/50 dark:bg-dark-surface/50 backdrop-blur-sm p-6 rounded-xl shadow-lg transition-transform hover:scale-105 border border-white/20">
                <span className="text-5xl font-extrabold text-primary-dark">♻️</span>
                <p className="text-4xl font-bold text-slate-dark dark:text-white mt-2">25%</p>
                <p className="text-gray-muted dark:text-dark-muted mt-1 font-semibold">Reduction in Waste</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Trending Products */}
      <section className="py-20 bg-secondary dark:bg-dark-surface/50">
        <div className="container mx-auto px-4">
            <ProductCarousel
                title={<>🔥 Trending on the Marketplace</>}
                subtitle="See what's popular with buyers right now."
                listings={trendingListings}
                loading={loading}
                onBookNow={handleBookNow}
            />
        </div>
      </section>

      {/* Newest Arrivals */}
      <section className="py-20 bg-green-50 dark:bg-dark-surface/50">
        <div className="container mx-auto px-4">
          <ProductCarousel
            title={<>🌱 Newest Arrivals</>}
            subtitle="Check out the latest products fresh from our farms."
            listings={newestListings}
            loading={loading}
            onBookNow={handleBookNow}
          />
        </div>
      </section>

      {/* Recommended for You Section */}
      {user && <RecommendedForYou user={user} />}

      {/* What Our Community Says - New Carousel */}
      {testimonials.length > 0 && (
          <section className="py-20 bg-green-50/50 dark:bg-dark-surface/30">
            <div className="container mx-auto text-center">
                <h2 className="text-3xl font-bold text-slate-dark dark:text-dark-text mb-2">What Our Community Says</h2>
                <p className="text-gray-muted dark:text-dark-muted mb-12">Real stories from farmers, buyers, and service providers.</p>

                {loadingTestimonials ? (
                    <div className="flex justify-center"><Spinner /></div>
                ) : (
                    <div
                        className="group relative w-full overflow-hidden [mask-image:_linear_gradient(to_right,transparent_0,_black_1rem,_black_calc(100%-1rem),transparent_100%)]"
                    >
                        <div className="flex animate-slide group-hover:[animation-play-state:paused]">
                            {[...testimonials, ...testimonials].map((testimonial, index) => (
                                <div key={`${testimonial.id}-${index}`} className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3 p-4">
                                    <TestimonialCard testimonial={testimonial} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </section>
      )}

    </div>
  );
};

export default LandingPage;
