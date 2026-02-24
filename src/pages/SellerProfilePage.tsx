
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { mockGetUserById, mockGetListingsBySeller, mockToggleFollow, mockFlagContent, mockGetSellerReviews, mockGetFollowerUsers, mockGetFollowingUsers } from '../services/mockApi';
import type { User, Listing, SellerReview } from '../types';
import Spinner from '../components/Spinner';
import ProductCard from '../components/ProductCard';
import StarRating from '../components/StarRating';
import VerificationBadge from '../components/VerificationBadge';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import FlagContentModal from '../components/FlagContentModal';
import SellerProfileSkeleton from '../components/SellerProfileSkeleton';
import BadgeDisplay from '../components/BadgeDisplay';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import UserFollowCard from '../components/UserFollowCard';
import BookingModal from '../components/BookingModal';

type Tab = 'listings' | 'reviews' | 'followers' | 'following';

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

const SellerProfilePage: React.FC = () => {
  const { sellerId } = useParams<{ sellerId: string }>();
  const { user, isAuthenticated, updateUser } = useAuth();
  const { addToast } = useToast();

  const [seller, setSeller] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<Tab>('listings');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isReporting, setIsReporting] = useState(false);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedListingForBooking, setSelectedListingForBooking] = useState<Listing | null>(null);

  const handleBookNow = (listing: Listing) => {
    setSelectedListingForBooking(listing);
    setIsBookingModalOpen(true);
  };


  useEffect(() => {
    if (!sellerId) {
      setError("No seller ID provided.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [sellerData, listingsData, reviewsData, followersData, followingData] = await Promise.all([
          mockGetUserById(sellerId),
          mockGetListingsBySeller(sellerId),
          mockGetSellerReviews(sellerId),
          mockGetFollowerUsers(sellerId),
          mockGetFollowingUsers(sellerId),
        ]);
        
        if (sellerData) {
          setSeller(sellerData);
          setListings(listingsData.filter(l => l.status === 'Active'));
          setReviews(reviewsData);
          setFollowers(followersData);
          setFollowing(followingData);
          if (user && sellerData.id) {
            setIsFollowing(user.following?.includes(sellerData.id) || false);
          }
          setFollowerCount(sellerData.followerCount);
        } else {
          setError("Seller not found.");
        }
      } catch (err) {
        setError("Failed to fetch seller profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sellerId, user]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated || !user || !seller) {
        addToast("Please log in to follow sellers.", "info");
        return;
    }
    if (user.id === seller.id) return;

    // Optimistic update
    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);
    setFollowerCount(prev => newFollowingState ? prev + 1 : prev - 1);
    
    const currentFollowing = user.following || [];
    const updatedFollowing = newFollowingState
        ? [...currentFollowing, seller.id]
        : currentFollowing.filter(id => id !== seller.id);
    updateUser({ following: updatedFollowing });

    try {
        await mockToggleFollow(user.id, seller.id);
    } catch (error) {
        addToast("Action failed. Please try again.", "error");
        // Revert UI on error
        setIsFollowing(!newFollowingState);
        setFollowerCount(prev => !newFollowingState ? prev + 1 : prev - 1);
        updateUser({ following: currentFollowing });
    }
  };
  
  const handleFlagSubmit = async (reason: string) => {
    if (!user || !seller) return;
    await mockFlagContent(user, seller.id, 'user', reason);
    addToast("User has been reported. Our team will review the report.", "success");
    setIsReporting(false);
  };

  const TabButton: React.FC<{ tab: Tab; label: string; count: number }> = ({ tab, label, count }) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`flex items-center gap-2 px-4 py-3 text-base font-semibold border-b-2 transition-colors ${
            activeTab === tab 
            ? 'text-primary border-primary' 
            : 'text-gray-muted dark:text-dark-muted border-transparent hover:text-slate-dark dark:hover:text-dark-text'
        }`}
    >
        <span>{label}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-dark-border'}`}>{count}</span>
    </button>
  );

  const UserList: React.FC<{users: User[]; emptyMessage: string;}> = ({ users, emptyMessage }) => {
    if (users.length === 0) {
        return <p className="text-gray-muted text-center py-8">{emptyMessage}</p>;
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map(u => <UserFollowCard key={u.id} user={u} />)}
        </div>
    );
  };


  if (loading) return <SellerProfileSkeleton />;
  if (error) return <div className="text-center p-10 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  if (!seller) return <div className="text-center p-10">Seller not found.</div>;

  return (
    <>
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        listing={selectedListingForBooking}
      />
      <div className="animate-fade-in">
        <BreadcrumbNavigation paths={[{ name: 'Marketplace', path: '/products' }, { name: 'Seller Profile' }]} />
        {/* Seller Header */}
        <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-md mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-full flex-shrink-0 border-4 border-primary-light overflow-hidden">
                {seller.profileImage ? (
                    <img src={seller.profileImage} alt={seller.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center font-bold text-white text-5xl"
                        style={{ backgroundColor: getColorForName(seller.name) }}
                    >
                        {getInitials(seller.name)}
                    </div>
                )}
            </div>
            <div className="flex-grow">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-dark dark:text-white">{seller.name}</h1>
                <VerificationBadge tier={seller.verificationTier} />
              </div>
              <p className="text-gray-muted dark:text-dark-muted mt-1">{seller.role} | {followerCount} Followers | {seller.following?.length || 0} Following</p>
              <div className="flex items-center gap-2 mt-3">
                <StarRating rating={seller.averageSellerRating} />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {(seller.averageSellerRating || 0).toFixed(1)} ({seller.sellerReviewCount} reviews)
                </span>
              </div>
              <p className="text-gray-muted dark:text-dark-muted mt-2">{seller.location}</p>
            </div>
            {isAuthenticated && user?.id !== seller.id && (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                      <button onClick={handleFollowToggle} className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}>
                          {isFollowing ? '✓ Following' : '+ Follow'}
                      </button>
                      <button onClick={() => setIsReporting(true)} className="btn btn-danger">Report User</button>
                  </div>
              )}
          </div>
        </div>

        {/* Badges */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-4">Badges</h2>
          <BadgeDisplay badgeIds={seller.badges || []} />
        </div>

        {/* Tabs */}
        <div className="border-b dark:border-dark-border mb-6">
            <nav className="flex -mb-px space-x-6">
                <TabButton tab="listings" label="Listings" count={listings.length} />
                <TabButton tab="reviews" label="Reviews" count={reviews.length} />
                <TabButton tab="followers" label="Followers" count={followers.length} />
                <TabButton tab="following" label="Following" count={following.length} />
            </nav>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
            {activeTab === 'listings' && (
                listings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {listings.map(listing => (
                        <ProductCard key={listing.id} listing={listing} onBookNow={handleBookNow} />
                    ))}
                    </div>
                ) : (
                    <EmptyState 
                        icon=" storefront"
                        title="No Active Listings"
                        message="This seller does not have any active listings at the moment."
                    />
                )
            )}
            {activeTab === 'reviews' && (
                <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-md">
                    {reviews.length > 0 ? (
                        <div className="space-y-6">
                            {reviews.map(review => (
                                <div key={review.id} className="border-b dark:border-dark-border pb-4 last:border-b-0 last:pb-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-slate-dark dark:text-white">{review.buyerName}</p>
                                            <p className="text-xs text-gray-muted dark:text-dark-muted">{new Date(review.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <StarRating rating={review.rating} />
                                    </div>
                                    <p className="mt-2 text-gray-600 dark:text-gray-300 italic">"{review.comment}"</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-muted dark:text-dark-muted">No reviews available yet.</p>
                    )}
                </div>
            )}
            {activeTab === 'followers' && <UserList users={followers} emptyMessage={`${seller.name} has no followers yet.`} />}
            {activeTab === 'following' && <UserList users={following} emptyMessage={`${seller.name} is not following anyone yet.`} />}
        </div>
      </div>
      
      {isReporting && (
            <FlagContentModal
                isOpen={isReporting}
                onClose={() => setIsReporting(false)}
                onSubmit={handleFlagSubmit}
                contentType="user"
                subjectName="this seller"
            />
        )}
    </>
  );
};

export default SellerProfilePage;
