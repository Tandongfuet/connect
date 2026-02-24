
import React, { useState, useEffect } from 'react';
import type { Order, SellerOrder } from '../types';
import StarRatingInput from './StarRatingInput';

interface SellerReviewModalProps {
    reviewTarget: { order: Order; sellerOrder: SellerOrder } | null;
    onClose: () => void;
    onSubmit: (target: { order: Order; sellerOrder: SellerOrder }, rating: number, comment: string) => Promise<void>;
}

const SellerReviewModal: React.FC<SellerReviewModalProps> = ({ reviewTarget, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Reset form state when a new review target is passed in
        if (reviewTarget) {
            setRating(0);
            setComment('');
        }
    }, [reviewTarget]);

    if (!reviewTarget) return null;
    
    const { sellerOrder } = reviewTarget;
    const sellerName = sellerOrder.sellerName;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit(reviewTarget, rating, comment);
        setLoading(false);
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-lg w-full">
                <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-2">Review Your Experience</h2>
                <p className="text-gray-muted dark:text-dark-muted mb-6">How was your transaction with <span className="font-semibold">{sellerName}</span>?</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">Overall Rating</label>
                        <StarRatingInput rating={rating} onRatingChange={setRating} />
                    </div>
                    <div>
                        <label htmlFor="seller-comment" className="label">Comments</label>
                        <textarea
                            id="seller-comment"
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="input"
                            placeholder="How was the communication and delivery?"
                            required
                        />
                    </div>
                    <div className="mt-8 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="btn btn-light" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading || rating === 0}>
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
         </div>
    );
};

export default SellerReviewModal;
