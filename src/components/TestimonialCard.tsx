import React from 'react';
import type { Testimonial } from '../types';
import StarRating from './StarRating';

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => {
    return (
        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-lg flex flex-col h-full border-t-4 border-primary relative overflow-hidden">
            <svg className="absolute top-0 right-0 h-24 w-24 text-primary/10 -translate-y-4 translate-x-4" fill="currentColor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M6 24h6v-6c0-3.309-2.691-6-6-6V6c6.617 0 12 5.383 12 12v6H6v-6zm14 0h6v-6c0-3.309-2.691-6-6-6V6c6.617 0 12 5.383 12 12v6h-12v-6z"/></svg>
            <div className="relative flex flex-col flex-grow">
                <StarRating rating={testimonial.rating} />
                <p className={`mt-4 text-gray-600 dark:text-gray-300 italic flex-grow`}>"{testimonial.quote}"</p>
                <div className="mt-auto pt-4 border-t border-gray-200 dark:border-dark-border">
                    <p className="font-semibold text-slate-dark dark:text-white">{testimonial.author}</p>
                    <p className="text-sm text-gray-muted dark:text-dark-muted">{testimonial.location}</p>
                </div>
            </div>
        </div>
    );
};

export default TestimonialCard;