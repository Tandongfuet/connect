import React, { useState } from 'react';

interface StarRatingInputProps {
    rating: number;
    onRatingChange: (rating: number) => void;
    maxStars?: number;
}

const StarRatingInput: React.FC<StarRatingInputProps> = ({ rating, onRatingChange, maxStars = 5 }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
        <div className="flex items-center">
            {[...Array(maxStars)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <button
                        type="button"
                        key={starValue}
                        className={`text-3xl focus:outline-none ${
                            (hoverRating || rating) >= starValue ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        onClick={() => onRatingChange(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`Rate ${starValue} stars`}
                    >
                        ★
                    </button>
                );
            })}
        </div>
    );
};

export default StarRatingInput;
