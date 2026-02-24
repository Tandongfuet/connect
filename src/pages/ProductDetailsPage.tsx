
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getListingById, toggleFollow, getListingReviews, submitListingReview } from '../services/api';
import type { Listing, Review } from '../types';
import Spinner from '../components/Spinner';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../hooks/useRole';
import AvailabilityBadge from '../components/AvailabilityBadge';
import StarRating from '../components/StarRating';
import VerificationBadge from '../components/VerificationBadge';
import BookingModal from '../components/BookingModal';
import ReviewForm from '../components/ReviewForm';
import LiveCheckModal from '../components/LiveCheckModal';
import GenerateVideoModal from '../components/GenerateVideoModal';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import ProductDetailsSkeleton from '../components/ProductDetailsSkeleton';
import SEO from '../components/SEO';

const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b'];
const getColorForName = (name: string) => {
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
};

const ProductDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [listing, setListing] = useState<Listing | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isBookingModalOpen, setBookingModalOpen] = useState(false);
    const [isLiveCheckModalOpen, setLiveCheckModalOpen] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isGenerateVideoModalOpen, setGenerateVideoModalOpen] = useState(false);
    const [isMainImageLoading, setIsMainImageLoading] = useState(true);

    const { addToCart } = useCart();
    const { addToast } = useToast();
    const { permissions } = useRole();
    const { user, isAuthenticated, updateUser } = useAuth();
    const navigate = useNavigate();
    
    const fetchListingData = useCallback(async (isInitialLoad = false) => {
        if (!id) {
            setError("No product ID provided.");
            if (isInitialLoad) setLoading(false);
            return;
        }
        
        try {
            const listingData = await getListingById(id);

            if (listingData) {
                setListing(listingData);
                if (isInitialLoad && listingData.images.length > 0) {
                    setSelectedImage(listingData.images[0].url);
                } else if (!selectedImage && listingData.images.length > 0) {
                    setSelectedImage(listingData.images[0].url);
                }
                
                if (user) {
                    setIsFollowing(user.following?.includes(listingData.seller.id) || false);
                }
            } else {
                setError("Product not found.");
            }
            // Reviews only need to be fetched once
            if (isInitialLoad) {
                const reviewsData = await getListingReviews(id);
                setReviews(reviewsData);
            }
        } catch (err) {
            setError("Failed to fetch product details.");
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    }, [id, user, selectedImage]);
    
    useEffect(() => {
        fetchListingData(true);
    }, [id]); // Rerun only when ID changes
    
    const handleSelectImage = (url: string) => {
        if (url !== selectedImage) {
            setIsMainImageLoading(true);
            setSelectedImage(url);
        }
    };

    const handleAddToCart = () => {
        if (!listing) return;
        addToCart(listing, quantity);
        addToast(`Added ${quantity} of "${listing.title}" to cart!`, 'success');
    };
    
    const handleBookService = () => {
        if (!listing || !listing.isService) return;
        setBookingModalOpen(true);
    };
    
    const handleContactSeller = () => {
        if (!listing) return;
        navigate(`/chat/${listing.seller.id}`, {
            state: { prefillMessage: `Hello, I'm interested in your listing: "${listing.title}".` }
        });
    }
    
    const handleFollowToggle = async () => {
        if (!isAuthenticated || !user || !listing) {
            addToast("Please log in to follow sellers.", "info");
            return;
        }
        if (user.id === listing.seller.id) return;

        const newFollowingState = !isFollowing;
        setIsFollowing(newFollowingState);

        const currentFollowing = user.following || [];
        const updatedFollowing = newFollowingState
            ? [...currentFollowing, listing.seller.id]
            : currentFollowing.filter(id => id !== listing.seller.id);
        updateUser({ following: updatedFollowing });

        try {
            await toggleFollow(user.id, listing.seller.id);
        } catch (error) {
            addToast("Action failed. Please try again.", "error");
            // Revert UI and context
            setIsFollowing(!newFollowingState);
            updateUser({ following: currentFollowing });
        }
    };
    
    const handleReviewSubmit = async (rating: number, comment: string) => {
        if (!user) {
            addToast("Please log in to submit a review.", "info");
            return;
        }
        if (!listing) return;
        
        try {
            await mockSubmitListingReview(listing.id, user, rating, comment);
            addToast("Thank you for your review!", "success");
            // Refetch data to show the new review and updated rating
            fetchListingData(true);
        } catch (error: any) {
            addToast(error.message || "Failed to submit review.", "error");
        }
    };


    if (loading) return <ProductDetailsSkeleton />;
    if (error) return <div className="text-center p-10 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    if (!listing) return <div className="text-center p-10">Product not found.</div>;

    const isSeller = isAuthenticated && user?.id === listing.seller.id;
    
    return (
        <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl animate-fade-in">
            <SEO
                title={`${listing.title} | AgroConnect`}
                description={`Buy ${listing.title} from ${listing.seller.name} in ${listing.seller.location || 'Cameroon'}. ${listing.description.substring(0, 120)}...`}
                keywords={`${listing.title}, ${listing.category}, ${listing.seller.name}, ${listing.seller.location || 'Cameroon'}, Cameroon agriculture, online market`}
            />
            <BreadcrumbNavigation paths={[{ name: 'Marketplace', path: '/products' }, { name: listing.title }]} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Image Gallery */}
                <div>
                    <div className="h-96 w-full overflow-hidden rounded-lg bg-gray-200 flex items-center justify-center dark:bg-dark-border relative">
                        {isMainImageLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-dark-border">
                                <Spinner size="lg" />
                            </div>
                        )}
                        <img 
                            src={selectedImage || ''} 
                            alt={listing.title} 
                            decoding="async"
                            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isMainImageLoading ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={() => setIsMainImageLoading(false)}
                            onError={() => setIsMainImageLoading(false)}
                        />
                    </div>
                    <div className="mt-4 grid grid-cols-5 gap-2">
                        {listing.images.map((image, index) => (
                            <button key={index} onClick={() => handleSelectImage(image.url)} className={`aspect-w-1 aspect-h-1 rounded-md overflow-hidden ring-2 ${selectedImage === image.url ? 'ring-primary' : 'ring-transparent hover:ring-primary-light'}`}>
                                <img src={image.url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                            </button>
                        ))}
                    </div>
                     {listing.promoVideoUrl && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold text-slate-dark dark:text-white mb-2">Promotional Video</h3>
                            <video src={listing.promoVideoUrl} controls className="w-full rounded-lg shadow-md" />
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-dark dark:text-white">{listing.title}</h1>

                    <p className="text-3xl text-primary mt-2 font-light">
                        XAF {listing.price.toLocaleString('fr-CM')}
                    </p>
                    <div className="mt-4 flex items-center">
                        <StarRating rating={listing.averageRating || 0} />
                        <span className="text-sm text-gray-500 ml-2">({listing.reviewCount || 0} reviews)</span>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-slate-dark dark:text-white">Description</h3>
                        <p className="text-gray-muted dark:text-dark-muted mt-2 whitespace-pre-wrap">{listing.description}</p>
                    </div>

                    {listing.isBulk && listing.tieredPricing && listing.tieredPricing.length > 0 && (
                        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-400">
                            <h3 className="font-semibold text-green-800 dark:text-green-200">Bulk Pricing Available</h3>
                            <ul className="mt-2 space-y-1 text-sm text-green-700 dark:text-green-300">
                                {listing.tieredPricing.map(tier => (
                                    <li key={tier.quantity}>Buy {tier.quantity} or more for <strong>XAF {tier.price.toLocaleString('fr-CM')}</strong> each</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {!listing.isService && (
                        <div className="mt-6 flex items-center gap-4">
                            <AvailabilityBadge stock={listing.stock} />
                            {(listing.stock !== undefined && listing.stock > 0) && (
                                <p className="text-sm text-gray-muted dark:text-dark-muted">
                                    <span className="font-semibold text-slate-dark dark:text-dark-text">{listing.stock.toLocaleString()}</span> units available
                                </p>
                            )}
                        </div>
                    )}

                    {permissions.canPurchase && (
                        <>
                            <div className="mt-8 flex items-center gap-4">
                                {!listing.isService && (
                                    <>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={e => {
                                                const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
                                                if (listing.stock !== undefined) {
                                                    setQuantity(Math.min(newQuantity, listing.stock));
                                                } else {
                                                    setQuantity(newQuantity);
                                                }
                                            }}
                                            className="w-20"
                                            min="1"
                                            max={listing.stock}
                                            disabled={listing.stock === undefined || listing.stock <= 0}
                                        />
                                        <button 
                                            onClick={handleAddToCart} 
                                            className="btn btn-primary flex-1"
                                            disabled={listing.stock === undefined || listing.stock <= 0}
                                        >
                                            {listing.stock !== undefined && listing.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                                        </button>
                                    </>
                                )}
                                {listing.isService && (
                                    <button onClick={handleBookService} className="btn btn-primary flex-1">Book This Service</button>
                                )}
                            </div>
                            {!listing.isService && (
                                <button 
                                    onClick={() => setLiveCheckModalOpen(true)} 
                                    className="btn btn-light w-full mt-4"
                                    disabled={listing.stock === undefined || listing.stock <= 0}
                                >
                                    🎥 Request Freshness Check
                                </button>
                            )}
                        </>
                    )}

                    {isSeller && (
                        <div className="mt-4">
                            {listing.promoVideoUrl ? (
                                <a href={listing.promoVideoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full">
                                    View Promotional Video
                                </a>
                            ) : (
                                <button onClick={() => setGenerateVideoModalOpen(true)} className="btn btn-light w-full">
                                    🤖 Generate Promotional Video
                                </button>
                            )}
                        </div>
                    )}
                    
                    <div className="mt-8 p-4 bg-secondary dark:bg-dark-border rounded-lg">
                        <h4 className="font-semibold text-slate-dark dark:text-white">Seller Information</h4>
                        <div className="mt-2 flex items-center justify-between">
                            <Link to={`/seller/${listing.seller.id}`} className="flex items-center gap-3 group">
                                {listing.seller.profileImage ? (
                                    <img src={listing.seller.profileImage} alt={listing.seller.name} className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg"
                                        style={{ backgroundColor: getColorForName(listing.seller.name) }}
                                    >
                                        {getInitials(listing.seller.name)}
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-slate-dark dark:text-dark-text group-hover:text-primary">{listing.seller.name}</p>
                                    <p className="text-sm text-gray-muted dark:text-dark-muted">{listing.seller.location}</p>
                                </div>
                                <VerificationBadge tier={listing.seller.verificationTier} />
                            </Link>
                            <div className="flex items-center gap-2">
                                {isAuthenticated && user?.id !== listing.seller.id && (
                                    <button onClick={handleFollowToggle} className={`btn btn-sm ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}>
                                        {isFollowing ? '✓ Following' : '+ Follow'}
                                    </button>
                                )}
                                <button onClick={handleContactSeller} className="btn btn-light btn-sm">Message</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-12 border-t dark:border-dark-border pt-8">
                <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-6">Customer Reviews ({reviews.length})</h2>
                {isAuthenticated && <ReviewForm onSubmit={handleReviewSubmit} />}
                
                {reviews.length > 0 ? (
                    <div className="space-y-6 mt-6">
                        {reviews.map(review => (
                            <div key={review.id} className="flex items-start gap-4">
                                {review.userProfileImage ? (
                                    <img src={review.userProfileImage} alt={review.userName} className="w-12 h-12 rounded-full object-cover"/>
                                ) : (
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
                                        style={{ backgroundColor: getColorForName(review.userName) }}
                                    >
                                        {getInitials(review.userName)}
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-semibold text-slate-dark dark:text-white">{review.userName}</p>
                                        <StarRating rating={review.rating} />
                                    </div>
                                    <p className="text-xs text-gray-muted dark:text-dark-muted">{new Date(review.createdAt).toLocaleDateString()}</p>
                                    <p className="mt-2 text-gray-600 dark:text-gray-300">{review.comment}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center text-gray-muted dark:text-dark-muted mt-6">
                        <p>No reviews yet for this product.</p>
                    </div>
                )}
            </div>

            <BookingModal isOpen={isBookingModalOpen} onClose={() => setBookingModalOpen(false)} listing={listing} />
            <LiveCheckModal isOpen={isLiveCheckModalOpen} onClose={() => setLiveCheckModalOpen(false)} />
             <GenerateVideoModal
                isOpen={isGenerateVideoModalOpen}
                onClose={() => setGenerateVideoModalOpen(false)}
                listing={listing}
                onSuccess={() => fetchListingData(true)}
            />
        </div>
    );
};

export default ProductDetailsPage;
