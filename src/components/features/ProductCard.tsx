
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../hooks/useRole';
import { useToast } from '../../contexts/ToastContext';
import type { Listing } from '../../types';
import AvailabilityBadge from '../ui/AvailabilityBadge';

interface ProductCardProps {
    listing: Listing;
    onBookNow: (listing: Listing) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ listing, onBookNow }) => {
    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { isAuthenticated } = useAuth();
    const { permissions } = useRole();
    const { addToast } = useToast();
    const [isImageLoading, setIsImageLoading] = useState(true);
    const [isAdded, setIsAdded] = useState(false);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isAdded) return;

        addToCart(listing, 1);
        addToast(`Added "${listing.title}" to cart!`, 'success');
        
        setIsAdded(true);
        setTimeout(() => {
            setIsAdded(false);
        }, 2000); // Reset after 2 seconds
    };

    const handleToggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(listing.id);
    };

    const handleBookNowClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onBookNow(listing);
    };

    return (
        <div className="border rounded-lg shadow-sm bg-white dark:bg-dark-surface overflow-hidden flex flex-col h-full group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <Link to={`/products/${listing.id}`} className="relative block">
                <div className="w-full h-48 bg-gray-200 dark:bg-dark-border overflow-hidden relative">
                    <img
                        src={listing.images[0]?.url}
                        alt={listing.title}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                        loading="lazy"
                        decoding="async"
                        onLoad={() => setIsImageLoading(false)}
                        onError={() => setIsImageLoading(false)}
                    />
                </div>
                {!listing.isService && (
                    <div className="absolute top-2 left-2">
                        <AvailabilityBadge stock={listing.stock} />
                    </div>
                )}
                {isAuthenticated && (
                    <button onClick={handleToggleWishlist} className="absolute top-2 right-2 bg-white/70 backdrop-blur-sm rounded-full p-2 text-gray-600 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isInWishlist(listing.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                        </svg>
                    </button>
                )}
            </Link>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-slate-dark dark:text-white group-hover:text-primary transition-colors">
                    <Link to={`/products/${listing.id}`}>{listing.title}</Link>
                </h3>
                
                {listing.seller.location && (
                    <p className="text-sm text-gray-muted dark:text-dark-muted mt-2 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {listing.seller.location}
                    </p>
                )}
                
                <p className="text-xl font-extrabold text-primary mt-2">
                    XAF {listing.price.toLocaleString('fr-CM')}
                </p>

                <div className="mt-auto pt-4">
                    {listing.isService ? (
                        <button onClick={handleBookNowClick} className="btn btn-primary w-full">Book Now</button>
                    ) : (
                        <button
                            onClick={handleAddToCart}
                            disabled={!permissions.canPurchase || listing.stock === 0 || isAdded}
                            className={`btn w-full transition-all duration-300 ${isAdded ? 'bg-green-600' : 'btn-primary'} disabled:bg-gray-300 disabled:cursor-not-allowed`}
                        >
                            {isAdded ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Added!
                                </span>
                            ) : (
                                listing.stock === 0 ? 'Out of Stock' : 'Add to Cart'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
