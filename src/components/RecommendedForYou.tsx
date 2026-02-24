
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { mockGetPersonalizedRecommendations } from '../services/mockApi';
import type { User, Listing } from '../types';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import BookingModal from './BookingModal';

interface RecommendedForYouProps {
    user: User | null;
}

const AUTOPLAY_INTERVAL = 60000; // 60 seconds, as requested. Can be changed to 30000.

const RecommendedForYou: React.FC<RecommendedForYouProps> = ({ user }) => {
    const [recommendations, setRecommendations] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const autoplayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);
    
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedListingForBooking, setSelectedListingForBooking] = useState<Listing | null>(null);

    const handleBookNow = (listing: Listing) => {
        setSelectedListingForBooking(listing);
        setIsBookingModalOpen(true);
    };

    useEffect(() => {
        const fetchRecs = async () => {
            setLoading(true);
            try {
                const recs = await mockGetPersonalizedRecommendations(user);
                setRecommendations(recs);
            } catch (error) {
                console.error("Failed to fetch recommendations:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecs();
    }, [user]);

    const checkScrollButtons = useCallback(() => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollPrev(scrollLeft > 1);
            setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 1);
        }
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || loading) return;

        const timerId = setTimeout(() => {
            checkScrollButtons();
        }, 100);

        container.addEventListener('scroll', checkScrollButtons, { passive: true });
        window.addEventListener('resize', checkScrollButtons);

        return () => {
            clearTimeout(timerId);
            if (container) {
                container.removeEventListener('scroll', checkScrollButtons);
            }
            window.removeEventListener('resize', checkScrollButtons);
        };
    }, [loading, recommendations, checkScrollButtons]);

    const handleScroll = useCallback((direction: 'prev' | 'next') => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const firstCard = container.children[0] as HTMLElement;
            if (!firstCard) return;

            const cardWidth = firstCard.offsetWidth;
            const gap = 32; // Tailwind gap-8 is 2rem -> 32px
            const scrollAmount = (cardWidth * 3) + (gap * 2);

            container.scrollBy({
                left: direction === 'next' ? scrollAmount : -scrollAmount,
                behavior: 'smooth'
            });
        }
    }, []);

    const stopAutoplay = useCallback(() => {
        if (autoplayIntervalRef.current) {
            clearInterval(autoplayIntervalRef.current);
            autoplayIntervalRef.current = null;
        }
    }, []);

    const startAutoplay = useCallback(() => {
        stopAutoplay();
        if (recommendations.length > 3) {
            autoplayIntervalRef.current = setInterval(() => {
                if (scrollContainerRef.current) {
                    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
                    if (scrollLeft >= scrollWidth - clientWidth - 1) {
                        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                    } else {
                        handleScroll('next');
                    }
                }
            }, AUTOPLAY_INTERVAL);
        }
    }, [handleScroll, stopAutoplay, recommendations.length]);

    useEffect(() => {
        if (!loading) {
            startAutoplay();
        }
        return () => stopAutoplay();
    }, [loading, startAutoplay, stopAutoplay]);

    const handleManualScroll = (direction: 'prev' | 'next') => {
        handleScroll(direction);
        startAutoplay(); // Reset timer on manual interaction
    };

    const title = user ? "Recommended For You" : "Trending on AgroConnect";
    const showControls = !loading && recommendations.length > 3;

    if (loading) {
        return (
            <section>
                <h2 className="text-3xl font-bold text-slate-dark dark:text-dark-text mb-8">{title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
            </section>
        );
    }
    
    if (recommendations.length === 0) {
        return null;
    }

    return (
        <>
            <BookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                listing={selectedListingForBooking}
            />
            <section
                className="relative"
                onMouseEnter={stopAutoplay}
                onMouseLeave={startAutoplay}
            >
                <div className="relative text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-dark dark:text-dark-text inline-block">{title}</h2>
                    {showControls && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-0 flex gap-2">
                            <button 
                                onClick={() => handleManualScroll('prev')} 
                                disabled={!canScrollPrev}
                                className="btn btn-secondary rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                                aria-label="Previous items"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button 
                                onClick={() => handleManualScroll('next')} 
                                disabled={!canScrollNext}
                                className="btn btn-secondary rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Next items"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    )}
                </div>
                <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory gap-8 pb-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {recommendations.map(listing => (
                        <div key={listing.id} className="snap-start flex-shrink-0 w-[80vw] sm:w-[45vw] md:w-[calc((100%/3)-1.334rem)]">
                            <ProductCard listing={listing} onBookNow={handleBookNow} />
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
};

export default RecommendedForYou;
