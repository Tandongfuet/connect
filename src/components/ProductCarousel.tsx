import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { Listing } from '../types';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';

interface ProductCarouselProps {
  title: React.ReactNode;
  subtitle: string;
  listings: Listing[];
  loading: boolean;
  onBookNow: (listing: Listing) => void;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ title, subtitle, listings, loading, onBookNow }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(true);

    const checkScrollButtons = useCallback(() => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            // Use a small tolerance to account for subpixel rendering
            setCanScrollPrev(scrollLeft > 1);
            setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 1);
        }
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || loading) return;
        
        // Initial check after a short delay to ensure layout is stable
        const timerId = setTimeout(() => {
            checkScrollButtons();
        }, 150);

        container.addEventListener('scroll', checkScrollButtons, { passive: true });
        window.addEventListener('resize', checkScrollButtons);

        return () => {
            clearTimeout(timerId);
            if (container) {
                container.removeEventListener('scroll', checkScrollButtons);
            }
            window.removeEventListener('resize', checkScrollButtons);
        };
    }, [loading, listings, checkScrollButtons]);

    const handleScroll = (direction: 'prev' | 'next') => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            // Scroll by 80% of the visible width for a pleasant scroll effect
            const scrollAmount = container.clientWidth * 0.8; 
            container.scrollBy({
                left: direction === 'next' ? scrollAmount : -scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (loading) {
        return (
            <div>
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-dark dark:text-dark-text">{title}</h2>
                    <p className="text-gray-muted dark:text-dark-muted mt-2">{subtitle}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
            </div>
        );
    }
    
    if (listings.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-dark dark:text-dark-text">{title}</h2>
                <p className="text-gray-muted dark:text-dark-muted mt-2">{subtitle}</p>
            </div>
            
             <div 
                ref={scrollContainerRef}
                className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory gap-6 pb-4 -mb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {listings.map(listing => (
                    // Defines the width of each card at different breakpoints to ensure responsiveness
                    <div key={listing.id} className="snap-start flex-shrink-0 w-[80vw] sm:w-[45vw] lg:w-[calc((100%/4)-1.125rem)]">
                        <ProductCard listing={listing} onBookNow={onBookNow} />
                    </div>
                ))}
            </div>

            {canScrollPrev && (
                <button 
                    onClick={() => handleScroll('prev')} 
                    className="absolute top-1/2 -left-4 -translate-y-1/2 z-10 bg-white dark:bg-dark-surface rounded-full p-2 shadow-lg border dark:border-dark-border hidden lg:block" 
                    aria-label="Previous items"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-dark dark:text-dark-text" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
            )}
            {canScrollNext && (
                <button 
                    onClick={() => handleScroll('next')} 
                    className="absolute top-1/2 -right-4 -translate-y-1/2 z-10 bg-white dark:bg-dark-surface rounded-full p-2 shadow-lg border dark:border-dark-border hidden lg:block"
                    aria-label="Next items"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-dark dark:text-dark-text" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            )}
        </div>
    );
};

export default ProductCarousel;