import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import type { Listing } from '../types';
import StarRating from './StarRating';
import VerificationBadge from './VerificationBadge';
import { useAuth } from '../contexts/AuthContext';

interface QuickViewModalProps {
    listing: Listing;
    isOpen: boolean;
    onClose: () => void;
    onBookNow: (listing: Listing) => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ listing, isOpen, onClose, onBookNow }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { addToast } = useToast();
    const { permissions } = useAuth();
    const [quantity, setQuantity] = useState(1);

    if (!isOpen) return null;

    const handleAddToCart = () => {
        addToCart(listing, quantity);
        addToast(`Added ${quantity} of "${listing.title}" to cart!`, 'success');
        onClose();
    };

    const handleBook = () => {
        onBookNow(listing);
        onClose();
    };

    const handleViewDetails = () => {
        navigate(`/products/${listing.id}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-white dark:bg-dark-surface w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative animate-pop-in max-h-[90vh]" 
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-dark-border rounded-full transition-colors"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-dark dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Image Section */}
                <div className="w-full md:w-1/2 h-64 md:h-auto bg-gray-100 dark:bg-dark-border relative group">
                    <img 
                        src={listing.images[0]?.url} 
                        alt={listing.title} 
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Details Section */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col h-full overflow-y-auto">
                     <div className="flex items-start justify-between mb-2">
                         <div>
                            <p className="text-sm text-primary font-semibold tracking-wide uppercase">{listing.category}</p>
                            <h2 className="text-2xl font-bold text-slate-dark dark:text-white mt-1">{listing.title}</h2>
                         </div>
                     </div>
                     
                     <div className="flex items-center gap-2 mb-4">
                         <StarRating rating={listing.averageRating || 0} />
                         <span className="text-sm text-gray-500 dark:text-dark-muted">({listing.reviewCount || 0} reviews)</span>
                     </div>

                     <p className="text-3xl font-bold text-primary mb-6">
                        XAF {listing.price.toLocaleString('fr-CM')}
                     </p>

                     <div className="prose dark:prose-invert text-sm text-gray-600 dark:text-gray-300 mb-6 flex-grow">
                         <p className="line-clamp-4">{listing.description}</p>
                     </div>

                     {/* Seller Info */}
                     <div className="flex items-center gap-3 mb-6 p-3 bg-secondary dark:bg-dark-border rounded-lg">
                        {listing.seller.profileImage ? (
                             <img src={listing.seller.profileImage} className="w-10 h-10 rounded-full object-cover" alt={listing.seller.name} />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary-dark font-bold text-sm">
                                {listing.seller.name.charAt(0)}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-1">
                                <p className="font-semibold text-sm text-slate-dark dark:text-white">{listing.seller.name}</p>
                                <VerificationBadge tier={listing.seller.verificationTier} size="sm" />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{listing.seller.location}</p>
                        </div>
                     </div>

                     {/* Actions */}
                     <div className="space-y-3 mt-auto">
                        {!listing.isService ? (
                            <div className="flex gap-4">
                                <div className="w-24">
                                    <label htmlFor="qv-quantity" className="sr-only">Quantity</label>
                                    <input 
                                        id="qv-quantity"
                                        type="number" 
                                        min="1" 
                                        max={listing.stock} 
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="input text-center"
                                        disabled={listing.stock === 0}
                                    />
                                </div>
                                <button 
                                    onClick={handleAddToCart}
                                    disabled={listing.stock === 0}
                                    className="btn btn-primary flex-grow disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {listing.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                            </div>
                        ) : (
                            <button onClick={handleBook} className="btn btn-primary w-full">
                                Book Service
                            </button>
                        )}
                        
                        <button onClick={handleViewDetails} className="btn btn-ghost w-full text-sm">
                            View Full Details
                        </button>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default QuickViewModal;