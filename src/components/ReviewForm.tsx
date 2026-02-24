
import React, { useState } from 'react';
import StarRatingInput from './StarRatingInput';
import Spinner from './Spinner';

interface ReviewFormProps {
    onSubmit: (rating: number, comment: string) => Promise<void>;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit(rating, comment);
        setLoading(false);
        setRating(0);
        setComment('');
    };

    return (
        <div className="bg-secondary dark:bg-dark-border dark:border-primary-dark p-6 rounded-lg mb-8 border border-primary-light">
            <h3 className="text-lg font-semibold text-slate-dark dark:text-white mb-4">Write a Review</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="label">Your Rating</label>
                    <StarRatingInput rating={rating} onRatingChange={setRating} />
                </div>
                 <div>
                    <label htmlFor="comment" className="label">Your Review</label>
                    <textarea 
                        id="comment" 
                        rows={4} 
                        value={comment} 
                        onChange={(e) => setComment(e.target.value)} 
                        required
                        className="input"
                    />
                </div>
                <div className="text-right">
                    <button type="submit" className="btn btn-primary" disabled={loading || rating === 0}>
                        {loading ? <Spinner size="sm"/> : 'Submit Review'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReviewForm;
