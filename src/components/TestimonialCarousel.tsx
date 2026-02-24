import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { Testimonial } from '../types';
import TestimonialCard from './TestimonialCard';
import Spinner from './Spinner';

interface TestimonialCarouselProps {
  title: React.ReactNode;
  subtitle: string;
  testimonials: Testimonial[];
  loading: boolean;
}

const AUTOPLAY_INTERVAL = 8000;

const TestimonialCarousel: React.FC<TestimonialCarouselProps> = ({ title, subtitle, testimonials, loading }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const autoplayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);
    
    const checkScrollButtons = useCallback(() => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollPrev(scrollLeft > 5);
            setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 5);
        }
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || loading) return;

        const timerId = setTimeout(checkScrollButtons, 100);
        container.addEventListener('scroll', checkScrollButtons, { passive: true });
        window.addEventListener('resize', checkScrollButtons);

        return () => {
            clearTimeout(timerId);
            if (container) container.removeEventListener('scroll', checkScrollButtons);
            window.removeEventListener('resize', checkScrollButtons);
        };
    }, [loading, testimonials, checkScrollButtons]);

    const handleScroll = useCallback((direction: 'prev' | 'next') => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const scrollAmount = container.clientWidth * 0.8;
            container.scrollBy({ left: direction === 'next' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
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
        if (testimonials.length > 3) {
            autoplayIntervalRef.current = setInterval(() => {
                if (scrollContainerRef.current) {
                    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
                    if (scrollLeft >= scrollWidth - clientWidth - 5) {
                        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                    } else {
                        handleScroll('next');
                    }
                }
            }, AUTOPLAY_INTERVAL);
        }
    }, [handleScroll, stopAutoplay, testimonials.length]);

    useEffect(() => {
        if (!loading) startAutoplay();
        return () => stopAutoplay();
    }, [loading, startAutoplay, stopAutoplay]);

    const handleManualScroll = (direction: 'prev' | 'next') => {
        handleScroll(direction);
        startAutoplay(); // Reset timer
    };

    if (loading) return <div className="flex justify-center"><Spinner /></div>;
    if (testimonials.length === 0) return null;

    const showControls = testimonials.length > 3;

    return (
        <div onMouseEnter={stopAutoplay} onMouseLeave={startAutoplay}>
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-dark dark:text-dark-text">{title}</h2>
                <p className="text-gray-muted dark:text-dark-muted mt-2">{subtitle}</p>
            </div>
            
            <div className="relative">
                <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory gap-8 pb-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {testimonials.map(testimonial => (
                        <div key={testimonial.id} className="snap-start flex-shrink-0 w-[80vw] sm:w-[45vw] lg:w-[calc((100%/3)-1.334rem)]">
                            <TestimonialCard testimonial={testimonial} />
                        </div>
                    ))}
                </div>

                {showControls && (
                    <>
                        <button 
                            onClick={() => handleManualScroll('prev')} 
                            disabled={!canScrollPrev}
                            className="absolute top-1/2 -left-4 -translate-y-1/2 z-10 bg-white dark:bg-dark-surface rounded-full p-2 shadow-lg border dark:border-dark-border hidden md:block disabled:opacity-50" 
                            aria-label="Previous testimonials"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button 
                            onClick={() => handleManualScroll('next')} 
                            disabled={!canScrollNext}
                            className="absolute top-1/2 -right-4 -translate-y-1/2 z-10 bg-white dark:bg-dark-surface rounded-full p-2 shadow-lg border dark:border-dark-border hidden md:block disabled:opacity-50"
                            aria-label="Next testimonials"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default TestimonialCarousel;
