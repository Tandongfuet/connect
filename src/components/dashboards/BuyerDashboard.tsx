import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
    getOrders, 
    getWishlist, 
    submitSellerReview, 
    submitDispute, 
    payForOrder, 
    getDisputesByUser, 
    updateOrderStatus, 
    getBookingsByUser, 
    confirmServiceCompletion, 
    submitDisputeForBooking, 
    getSavedArticles, 
    getAgriculturalTasks, 
    getTransactions, 
    getFollowingUsers,
    cancelOrder,
    cancelBooking
} from '../../services/api';
import type { Order, Listing, SellerReview, Dispute, SellerOrder, Booking, Article, AgriculturalTask, Transaction, User } from '../../types';
import Spinner from '../Spinner';
import EmptyState from '../EmptyState';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import ProductCard from '../ProductCard';
import { useToast } from '../../contexts/ToastContext';
import SellerReviewModal from '../SellerReviewModal';
import PaymentModal from '../PaymentModal';
import OrderTrackingDetails from '../OrderTrackingDetails';
import ChatInterface from '../ChatInterface';
import VerificationStatusBanner from '../VerificationStatusBanner';
import VerificationForm from '../VerificationForm';
import DisputeModal from '../DisputeModal';
import DisputeListItem from '../DisputeListItem';
import { OrderStatus, BookingStatus, TransactionType, TransactionStatus } from '../../constants';
import OnboardingTour, { type TourStep } from '../OnboardingTour';
import FinancialModal from '../FinancialModal';
import RecommendedForYou from '../RecommendedForYou';
import UserFollowCard from '../UserFollowCard';
import RecipeAssistant from './RecipeAssistant';
import { useLanguage } from '../../contexts/LanguageContext';
import DashboardSkeleton from '../DashboardSkeleton';
import TransferFundsModal from '../TransferFundsModal';
import { exportToCsv } from '../../utils/csvExporter';
import BookingModal from '../BookingModal';
import ConfirmationModal from '../ConfirmationModal';

type Tab = 'overview' | 'orders' | 'bookings' | 'favorites' | 'savedArticles' | 'messages' | 'profile' | 'calendar' | 'disputes' | 'wallet' | 'following' | 'recipes';

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


interface BuyerDashboardProps {
  startTour?: boolean;
}

const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ startTour = false }) => {
    const { user, updateUser } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const location = useLocation();
    
    // Centralized data states
    const [orders, setOrders] = useState<Order[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [favorites, setFavorites] = useState<Listing[]>([]);
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [savedArticles, setSavedArticles] = useState<Article[]>([]);
    const [freshProduce, setFreshProduce] = useState<string[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [following, setFollowing] = useState<User[]>([]);
    
    // UI states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const getTabKey = useCallback(() => `agroconnect_buyer_tab_${user?.id}`, [user]);
    const [activeTab, setActiveTab] = useState<Tab>(() => {
        const stateTab = (location.state as any)?.defaultTab;
        if (stateTab) {
            return stateTab;
        }
        if (!user) return 'overview';
        return (localStorage.getItem(getTabKey()) as Tab) || 'overview';
    });

    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedListingForBooking, setSelectedListingForBooking] = useState<Listing | null>(null);

    const handleBookNow = (listing: Listing) => {
        setSelectedListingForBooking(listing);
        setIsBookingModalOpen(true);
    };

    useEffect(() => {
        if (user) {
            localStorage.setItem(getTabKey(), activeTab);
        }
    }, [activeTab, user, getTabKey]);

    const [reviewTarget, setReviewTarget] = useState<{order: Order, sellerOrder: SellerOrder} | null>(null);
    const [payable, setPayable] = useState<Order | Booking | null>(null);
    const [orderToDispute, setOrderToDispute] = useState<{ order: Order; sellerOrder: SellerOrder } | null>(null);
    const [bookingToDispute, setBookingToDispute] = useState<Booking | null>(null);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [confirmingDelivery, setConfirmingDelivery] = useState<string | null>(null);
    const [confirmingService, setConfirmingService] = useState<string | null>(null);
    const [isFinancialModalOpen, setFinancialModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'deposit' | 'withdraw'>('deposit');
    
    const [itemToCancel, setItemToCancel] = useState<{ id: string, type: 'order' | 'booking' } | null>(null);

    const [showTour, setShowTour] = useState(false);
    const tourKey = user ? `tour_completed_buyer_${user.id}` : '';

    const tourSteps: TourStep[] = [
        { 
            target: '#buyer-stats', 
            title: "Welcome, Buyer!", 
            content: "This is your personal dashboard. Track your active orders and favorite items right here." 
        },
        {
            target: '#user-profile-menu-button',
            title: "Profile & Settings",
            content: "Click here to access your profile settings, where you can update your personal information, change your password, and manage your account."
        },
        { 
            target: '#buyer-quick-actions', 
            title: "Quick Actions", 
            content: "Use these quick actions to jump directly into the marketplace or check the seasonal calendar for what's fresh." 
        },
        { 
            target: '#buyer-tabs-nav', 
            title: "Your Account", 
            content: "These tabs are your command center. Review past orders, manage your profile, and chat directly with sellers." 
        },
        { 
            target: '#buyer-favorites-tab', 
            title: "Your Wishlist", 
            content: "Find an item you love? Click the heart icon to save it to your Wishlist, which you can access from this tab." 
        },
        { 
            target: '#buyer-wallet-tab', 
            title: "Manage Your Wallet", 
            content: "Manage your account balance in the Wallet tab. You can deposit funds for faster checkouts." 
        }
    ];

    useEffect(() => {
        if (startTour && tourKey) {
            const hasCompleted = localStorage.getItem(tourKey);
            if (!hasCompleted) {
                setTimeout(() => setShowTour(true), 500);
            }
        }
    }, [startTour, tourKey]);

    const handleTourFinish = () => {
        setShowTour(false);
        if (tourKey) localStorage.setItem(tourKey, 'true');
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const currentMonth = new Date().getMonth() + 1;
            const [
                ordersData,
                bookingsData,
                favoritesData,
                disputesData,
                savedArticlesData,
                freshTasks,
                transactionsData,
                followingData,
            ] = await Promise.all([
                getOrders(user.id),
                getBookingsByUser(user.id),
                getWishlist(user.id),
                getDisputesByUser(user.id),
                getSavedArticles(user.id),
                getAgriculturalTasks({ month: currentMonth, taskType: 'Harvesting' }),
                getTransactions(user.id),
                getFollowingUsers(user.id),
            ]);
            
            setOrders(ordersData);
            setBookings(bookingsData);
            setFavorites(favoritesData);
            setDisputes(disputesData);
            setSavedArticles(savedArticlesData);
            setFreshProduce(Array.from(new Set(freshTasks.map(t => `${t.icon} ${t.crop}`))));
            setTransactions(transactionsData);
            setFollowing(followingData);

        } catch (err: any) {
            setError(err.message || 'Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const refreshData = useCallback(() => {
        fetchData();
    }, [fetchData]);

    const openFinancialModal = (mode: 'deposit' | 'withdraw') => {
        setModalMode(mode);
        setFinancialModalOpen(true);
    };

    const handleOrderDisputeSubmit = async (reasonCategory: string, reasonMessage: string) => {
        if (!user || !orderToDispute) return;
        try {
            const { order, sellerOrder } = orderToDispute;
            const newDispute = await submitDispute(order, sellerOrder.sellerId, reasonCategory, reasonMessage, user);
            addToast('Dispute submitted successfully. An admin will review your case.', 'success');
            setOrderToDispute(null);
            refreshData();
            navigate(`/disputes/${newDispute.id}`);
        } catch (err: any) {
            addToast(err.message || 'Failed to submit dispute.', 'error');
        }
    };
    
     const handleBookingDisputeSubmit = async (reasonCategory: string, reasonMessage: string) => {
        if (!user || !bookingToDispute) return;
        try {
            const newDispute = await submitDisputeForBooking(bookingToDispute, reasonCategory, reasonMessage, user);
            addToast('Dispute submitted successfully. An admin will review your case.', 'success');
            setBookingToDispute(null);
            refreshData();
            navigate(`/disputes/${newDispute.id}`);
        } catch (err: any) {
            addToast(err.message || 'Failed to submit dispute.', 'error');
        }
    };
    
    const handleReviewSubmit = async (target: { order: Order; sellerOrder: SellerOrder }, rating: number, comment: string) => {
        if (!user) return;
        try {
            await submitSellerReview(target.order.id, target.sellerOrder.sellerId, user, rating, comment);
            addToast('Thank you for your review!', 'success');
            setReviewTarget(null);
            refreshData();
        } catch (err: any) {
             addToast(err.message || 'Failed to submit review.', 'error');
        }
    };
    
    const handlePaymentSuccess = () => {
        refreshData();
    };

    const handleConfirmDelivery = async (orderId: string, sellerId: string) => {
        setConfirmingDelivery(`${orderId}_${sellerId}`);
        try {
            await updateOrderStatus(orderId, sellerId, OrderStatus.Completed);
            addToast("Delivery confirmed! Your order is now complete.", "success");
            refreshData();
        } catch(err: any) {
            addToast(err.message || "Failed to confirm delivery.", "error");
        } finally {
            setConfirmingDelivery(null);
        }
    };

    const handleConfirmService = async (bookingId: string) => {
        if (!user) return;
        setConfirmingService(bookingId);
        try {
            await confirmServiceCompletion(bookingId, user);
            addToast("Service completion confirmed! Funds have been released to the provider.", "success");
            refreshData();
        } catch(err: any) {
            addToast(err.message || "Failed to confirm service completion.", "error");
        } finally {
            setConfirmingService(null);
        }
    };

    const handleConfirmCancellation = async () => {
        if (!user || !itemToCancel) return;
        try {
            if (itemToCancel.type === 'order') {
                await cancelOrder(itemToCancel.id, user.id);
                addToast("Order cancelled successfully.", "success");
            } else {
                await cancelBooking(itemToCancel.id, user.id);
                addToast("Booking cancelled successfully.", "success");
            }
            refreshData();
        } catch (err: any) {
            addToast(err.message || "Failed to cancel.", "error");
        } finally {
            setItemToCancel(null);
        }
    };

    if (loading) return <DashboardSkeleton />;
    if (error) return <div className="text-center p-10 bg-red-50 text-red-700 rounded-lg">{error}</div>;
    
    const toggleOrderDetails = (orderId: string) => {
        setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
    };

    const TabButton: React.FC<{ tab: Tab, label: string, id?: string }> = ({ tab, label, id }) => (
      <button 
        id={id}
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'text-slate-dark dark:text-dark-text hover:bg-secondary dark:hover:bg-dark-border'}`}
      >
        {label}
      </button>
    );
    
    const formatCurrency = (amount: number) => `XAF ${amount.toLocaleString('fr-CM')}`;

    const StatCard: React.FC<{ title: string; value: string | number; icon: string }> = ({ title, value, icon }) => (
        <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md flex items-center">
            <div className="p-3 bg-primary-light text-primary-dark rounded-full text-2xl">{icon}</div>
            <div className="ml-4">
                <p className="text-2xl font-bold text-slate-dark dark:text-dark-text">{value}</p>
                <p className="text-sm text-gray-muted dark:text-dark-muted">{title}</p>
            </div>
        </div>
    );
    
    const getBookingStatusChip = (status: BookingStatus) => {
        const base = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
        const statusClasses: Record<BookingStatus, string> = {
            [BookingStatus.Pending]: 'bg-gray-100 text-gray-800',
            [BookingStatus.AwaitingPayment]: 'bg-yellow-100 text-yellow-800',
            [BookingStatus.Processing]: 'bg-blue-100 text-blue-800',
            [BookingStatus.AwaitingCompletion]: 'bg-purple-100 text-purple-800',
            [BookingStatus.Completed]: 'bg-green-100 text-green-800',
            [BookingStatus.Cancelled]: 'bg-red-100 text-red-800',
            [BookingStatus.Disputed]: 'bg-red-100 text-red-800',
            [BookingStatus.Confirmed]: 'bg-yellow-100 text-yellow-800',
        };
        return <span className={`${base} ${statusClasses[status]}`}>{status}</span>;
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-8">
                                <div id="buyer-stats" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <StatCard title="Active Orders" value={orders.filter(o => o.sellerOrders.some(so => so.status === 'Processing' || so.status === 'Shipped')).length} icon="🚚" />
                                    <StatCard title="Wishlist Items" value={favorites.length} icon="❤️" />
                                </div>
                                <div id="buyer-quick-actions" className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-md">
                                    <h3 className="text-xl font-semibold text-slate-dark dark:text-dark-text mb-4">Quick Actions</h3>
                                    <div className="flex flex-wrap gap-4">
                                        <Link to="/products" className="btn btn-primary">Browse Marketplace</Link>
                                        <Link to="/seasonal-calendar" className="btn btn-light">Seasonal Calendar</Link>
                                    </div>
                                </div>
                            </div>
                             <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md flex flex-col">
                                <h3 className="font-semibold text-slate-dark dark:text-dark-text mb-2 flex items-center gap-2">
                                    <span className="text-2xl">🌿</span>
                                    <span>What's Fresh This Month?</span>
                                </h3>
                                <p className="text-sm text-gray-muted dark:text-dark-muted mb-4 border-b dark:border-dark-border pb-2">
                                    Discover produce currently being harvested.
                                </p>
                                {freshProduce.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2 text-sm flex-grow">
                                        {freshProduce.slice(0, 6).map(produce => (
                                            <div key={produce} className="p-2 bg-secondary dark:bg-dark-border rounded-md font-medium text-slate-dark dark:text-dark-text">
                                                {produce}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-center text-gray-muted dark:text-dark-muted py-4 flex-grow">Checking for fresh produce...</p>
                                )}
                                <Link to="/seasonal-calendar" className="text-primary font-semibold hover:underline text-sm mt-4 block text-center">
                                    See What’s Coming →
                                </Link>
                            </div>
                        </div>
                        <div className="mt-8">
                            <RecommendedForYou user={user} />
                        </div>
                    </div>
                );
            case 'orders':
                return (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text">My Orders</h2>
                            <button onClick={() => exportToCsv('my_orders.csv', orders)} className="btn btn-secondary">Export to CSV</button>
                        </div>
                        {orders.length > 0 ? (
                            orders.map(order => (
                                <div key={order.id} className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
                                    <div className="flex justify-between items-start flex-wrap gap-2">
                                        <div>
                                            <h3 className="font-semibold text-slate-dark dark:text-dark-text">Order #{order.id.slice(-6)}</h3>
                                            <p className="text-sm text-gray-muted dark:text-dark-muted">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-primary">XAF {order.totalPrice.toLocaleString('fr-CM')}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t dark:border-dark-border space-y-4">
                                        {order.sellerOrders.map(sellerOrder => (
                                            <div key={sellerOrder.sellerId} className="p-3 bg-secondary dark:bg-dark-surface/50 rounded-md">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            {sellerOrder.sellerProfileImage ? (
                                                                <img src={sellerOrder.sellerProfileImage} alt={sellerOrder.sellerName} className="w-6 h-6 rounded-full object-cover" />
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs" style={{backgroundColor: getColorForName(sellerOrder.sellerName)}}>
                                                                    {getInitials(sellerOrder.sellerName)}
                                                                </div>
                                                            )}
                                                            <p className="font-semibold text-sm">From: {sellerOrder.sellerName}</p>
                                                        </div>
                                                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-1 ml-8">
                                                             {sellerOrder.items.map(item => <li key={item.listing.id}>{item.listing.title} (Qty: {item.quantity})</li>)}
                                                        </ul>
                                                    </div>
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sellerOrder.status === 'Delivered' || sellerOrder.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {sellerOrder.status}
                                                    </span>
                                                </div>
                                                <div className="flex justify-end gap-2 mt-3">
                                                    {sellerOrder.status === OrderStatus.Delivered && (
                                                        <button onClick={() => handleConfirmDelivery(order.id, sellerOrder.sellerId)} className="btn btn-sm btn-primary" disabled={confirmingDelivery === `${order.id}_${sellerOrder.sellerId}`}>
                                                            {confirmingDelivery === `${order.id}_${sellerOrder.sellerId}` ? <Spinner size="sm"/> : 'Confirm Delivery'}
                                                        </button>
                                                    )}
                                                     {sellerOrder.status === OrderStatus.Completed && !sellerOrder.isReviewed && (
                                                        <button onClick={() => setReviewTarget({ order, sellerOrder })} className="btn btn-sm btn-light">Leave Review</button>
                                                     )}
                                                     {[OrderStatus.Processing, OrderStatus.Shipped, OrderStatus.Delivered].includes(sellerOrder.status) && (
                                                        <button onClick={() => setOrderToDispute({ order, sellerOrder })} className="btn btn-sm btn-danger">Report Issue</button>
                                                     )}
                                                     {sellerOrder.status === 'Disputed' && (
                                                        <Link to={`/disputes/dispute_${order.id}_${sellerOrder.sellerId}`} className="btn btn-sm btn-danger">View Dispute</Link>
                                                     )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 pt-4 border-t dark:border-dark-border flex flex-wrap gap-2 items-center">
                                        <button onClick={() => toggleOrderDetails(order.id)} className="btn btn-sm btn-secondary">
                                            {expandedOrderId === order.id ? 'Hide Details' : 'View Full Details & Tracking'}
                                        </button>
                                        {order.sellerOrders.some(so => so.status === OrderStatus.PendingPayment) && (
                                            <button onClick={() => setPayable(order)} className="btn btn-sm btn-primary">Pay Now</button>
                                        )}
                                        {order.sellerOrders.every(so => [OrderStatus.PendingPayment, OrderStatus.Processing].includes(so.status)) && (
                                            <button 
                                                onClick={() => setItemToCancel({ id: order.id, type: 'order' })} 
                                                className="btn btn-sm btn-danger"
                                            >
                                                Cancel Order
                                            </button>
                                        )}
                                    </div>
                                    {expandedOrderId === order.id && <OrderTrackingDetails order={order} />}
                                </div>
                            ))
                        ) : (
                            <EmptyState 
                                icon="📦" 
                                title="No Orders Yet" 
                                message="You haven't placed any orders. Let's find something for you!"
                                actionText="Browse Marketplace"
                                actionTo="/products"
                            />
                        )}
                    </div>
                );
             case 'bookings':
                return (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text">My Bookings</h2>
                            <button onClick={() => exportToCsv('my_bookings.csv', bookings)} className="btn btn-secondary">Export to CSV</button>
                        </div>
                        {bookings.length > 0 ? (
                            bookings.map(booking => (
                                <div key={booking.id} className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold">{booking.serviceTitle}</h3>
                                            <p className="text-sm text-gray-muted">Booking Date: {new Date(booking.bookingDate).toLocaleDateString()}</p>
                                        </div>
                                        {getBookingStatusChip(booking.status)}
                                    </div>
                                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                                        {booking.status === BookingStatus.AwaitingPayment && (
                                            <button onClick={() => setPayable(booking)} className="btn btn-sm btn-primary">Pay Now</button>
                                        )}
                                        {booking.status === BookingStatus.AwaitingCompletion && (
                                            <button onClick={() => handleConfirmService(booking.id)} className="btn btn-sm btn-light" disabled={confirmingService === booking.id}>
                                                 {confirmingService === booking.id ? <Spinner size="sm" /> : 'Confirm Completion'}
                                            </button>
                                        )}
                                         {[BookingStatus.Pending, BookingStatus.AwaitingPayment].includes(booking.status) && (
                                             <button 
                                                onClick={() => setItemToCancel({ id: booking.id, type: 'booking' })} 
                                                className="btn btn-sm btn-danger"
                                            >
                                                Cancel Booking
                                            </button>
                                         )}
                                         {[BookingStatus.Processing, BookingStatus.AwaitingCompletion].includes(booking.status) && (
                                            <button onClick={() => setBookingToDispute(booking)} className="btn btn-sm btn-danger">Report Issue</button>
                                         )}
                                         {booking.status === BookingStatus.Disputed && (
                                            <Link to={`/disputes/dispute_booking_${booking.id}`} className="btn btn-sm btn-danger">View Dispute</Link>
                                         )}
                                    </div>
                                </div>
                            ))
                        ) : (
                             <EmptyState 
                                icon="📅" 
                                title="No Bookings Yet" 
                                message="You haven't booked any services. Find trusted providers in the marketplace."
                                actionText="Browse Services"
                                actionTo="/products"
                            />
                        )}
                    </div>
                );
            case 'disputes':
                return (
                    <section className="animate-fade-in">
                        <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text mb-6">{t('tabDisputes')}</h2>
                        {disputes.length > 0 ? (
                            <div className="space-y-4">
                                {disputes.map(dispute => (
                                    <DisputeListItem key={dispute.id} dispute={dispute} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState 
                                icon="⚖️"
                                title="No Disputes" 
                                message="You have no open or past disputes."
                            />
                        )}
                    </section>
                );
            case 'favorites':
                return (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {favorites.length > 0 ? (
                            favorites.map(listing => <ProductCard key={listing.id} listing={listing} onBookNow={handleBookNow} />)
                        ) : (
                            <div className="col-span-full">
                                <EmptyState 
                                    icon="❤️"
                                    title="No Wishlist Items Yet"
                                    message="You haven't added any items to your wishlist. Click the heart icon on a product to save it here."
                                    actionText="Explore Products"
                                    actionTo="/products"
                                />
                            </div>
                        )}
                    </div>
                );
            case 'savedArticles':
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text mb-6">{t('tabSavedArticles')}</h2>
                        {savedArticles.length > 0 ? (
                            <div className="space-y-4">
                                {savedArticles.map(article => (
                                    <Link to={`/community/hub/${article.id}`} key={article.id} className="block bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                                        <p className="text-sm text-primary font-semibold">{article.category}</p>
                                        <h3 className="text-lg font-bold text-slate-dark dark:text-white mt-1">{article.title}</h3>
                                        <p className="text-xs text-gray-muted dark:text-dark-muted mt-2">By {article.authorName} on {new Date(article.createdAt).toLocaleDateString()}</p>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <EmptyState 
                                icon="📚"
                                title="No Saved Articles"
                                message="You haven't saved any articles from the Educational Hub yet. Explore the hub and save articles to read later."
                                actionText="Explore Educational Hub"
                                actionTo="/community"
                            />
                        )}
                    </div>
                );
            case 'wallet':
                const pendingTransactions = transactions.filter(tx => tx.status === TransactionStatus.Pending);
                const completedTransactions = transactions.filter(tx => tx.status === TransactionStatus.Completed);

                return (
                     <section className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text">{t('tabWallet')}</h2>
                            <button onClick={() => exportToCsv('my_transactions.csv', transactions)} className="btn btn-secondary">Export to CSV</button>
                        </div>
                         <div className="bg-secondary dark:bg-dark-surface/50 p-6 rounded-lg mb-8 border dark:border-dark-border">
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div>
                                    <p className="text-gray-muted dark:text-dark-muted text-sm uppercase tracking-wider font-bold">Available</p>
                                    <p className="text-3xl font-extrabold text-primary-dark dark:text-primary-light">{formatCurrency(user?.accountBalance || 0)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openFinancialModal('deposit')} className="btn btn-primary">Deposit</button>
                                    <button onClick={() => setIsTransferModalOpen(true)} className="btn btn-secondary">Send Money</button>
                                </div>
                            </div>
                        </div>

                         {/* Pending Transactions Section */}
                         {pendingTransactions.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-orange-600 animate-pulse"></span>
                                    Processing Transactions
                                </h3>
                                <div className="space-y-3">
                                    {pendingTransactions.map(tx => (
                                        <div key={tx.id} className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 flex justify-between items-center shadow-sm">
                                            <div>
                                                <p className="font-bold text-slate-dark dark:text-white">{tx.description}</p>
                                                <p className="text-xs text-orange-600/70 dark:text-orange-400/70">{new Date(tx.date).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-black ${[TransactionType.Deposit, TransactionType.Refund, TransactionType.Transfer].includes(tx.type) && tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                                </p>
                                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full">Processing</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         )}

                         <h3 className="text-xl font-bold text-slate-dark dark:text-dark-text mb-4 mt-8">Recent History</h3>
                         <div className="space-y-3">
                            {completedTransactions.length > 0 ? completedTransactions.map(tx => (
                                <div key={tx.id} className="bg-white dark:bg-dark-surface p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border flex justify-between items-center hover:shadow-md transition-shadow">
                                    <div>
                                        <p className="font-bold text-slate-dark dark:text-dark-text">{tx.description}</p>
                                        <p className="text-xs text-gray-muted dark:text-dark-muted">{new Date(tx.date).toLocaleString()}</p>
                                    </div>
                                    <span className={`font-black ${[TransactionType.Deposit, TransactionType.Refund, TransactionType.Transfer].includes(tx.type) && tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                    </span>
                                </div>
                            )) : (
                                <p className="text-center text-gray-muted py-8 bg-gray-50 dark:bg-dark-surface rounded-xl border-2 border-dashed dark:border-dark-border">No finalized transactions yet.</p>
                            )}
                         </div>
                     </section>
                );
            case 'messages':
                return (
                    <section className="animate-fade-in flex flex-col h-[65vh]">
                        <ChatInterface />
                    </section>
                );
             case 'calendar':
                return (
                    <section className="animate-fade-in text-center">
                        <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-md max-w-2xl mx-auto">
                            <div className="text-5xl mb-4">🗓️</div>
                            <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text">Never Miss a Harvest</h2>
                            <p className="text-gray-muted dark:text-dark-muted mt-2 mb-6">
                                Visit our Seasonal Produce Calendar to see what's fresh. Click the 🔔 icon next to any product to get an alert as soon as it's harvested and available in the marketplace!
                            </p>
                            <Link to="/seasonal-calendar" className="btn btn-primary">
                                Go to Calendar
                            </Link>
                        </div>
                    </section>
                );
            case 'profile':
                 return (
                    <section className="animate-fade-in space-y-6">
                        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-md">
                             <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text">Profile Settings</h2>
                                    <p className="text-gray-muted dark:text-dark-muted">Manage your account information and verification status.</p>
                                </div>
                                <Link to="/settings" className="btn btn-primary">{t('edit')} {t('settingsProfile')}</Link>
                             </div>
                        </div>
                        <VerificationForm />
                    </section>
                );
            case 'following':
                return (
                    <section className="animate-fade-in">
                        <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text mb-4">Sellers I'm Following</h2>
                        {following.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {following.map(seller => <UserFollowCard key={seller.id} user={seller} />)}
                            </div>
                        ) : <EmptyState icon="👀" title="You're Not Following Anyone Yet" message="Follow sellers to get updates on their new products and see them here." actionText="Browse Marketplace" actionTo="/products" />}
                    </section>
                );
            case 'recipes':
                return (
                    <section className="animate-fade-in">
                        <RecipeAssistant orders={orders} />
                    </section>
                );
            default: return null;
        }
    }

    return (
        <div className="space-y-8">
            <BookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                listing={selectedListingForBooking}
            />
            <OnboardingTour steps={tourSteps} isOpen={showTour} onClose={handleTourFinish} />
            <div id="verification-banner">
                <VerificationStatusBanner status={user?.verificationStatus} onVerifyClick={() => setActiveTab('profile')} />
            </div>
            <div id="buyer-tabs-nav" className="flex flex-wrap gap-2 border-b dark:border-dark-border pb-4">
                <TabButton tab="overview" label={t('tabOverview')} />
                <TabButton tab="orders" label={t('tabMyOrders')} />
                <TabButton tab="bookings" label={t('tabMyBookings')} />
                <TabButton tab="recipes" label={t('tabRecipes')} />
                <TabButton tab="following" label={t('tabFollowing')} />
                <TabButton tab="disputes" label={t('tabDisputes')} />
                <TabButton tab="wallet" label={t('tabWallet')} id="buyer-wallet-tab" />
                <TabButton tab="favorites" label={t('tabFavorites')} id="buyer-favorites-tab"/>
                <TabButton tab="savedArticles" label={t('tabSavedArticles')} />
                <TabButton tab="calendar" label={t('tabCalendarAlerts')} />
                <TabButton tab="messages" label={t('tabMessages')} />
                <TabButton tab="profile" label={t('tabProfileAndVerification')} />
            </div>
            
            {renderContent()}

            <SellerReviewModal
                reviewTarget={reviewTarget}
                onClose={() => setReviewTarget(null)}
                onSubmit={handleReviewSubmit}
            />
            
            <PaymentModal 
                isOpen={!!payable}
                onClose={() => setPayable(null)}
                payable={payable}
                onSuccess={handlePaymentSuccess}
            />
            
            <DisputeModal
                isOpen={!!orderToDispute || !!bookingToDispute}
                onClose={() => { setOrderToDispute(null); setBookingToDispute(null); }}
                subjectId={
                    orderToDispute ? `Order #${orderToDispute.order.id.slice(-6)} (Seller: ${orderToDispute.sellerOrder.sellerName})` :
                    bookingToDispute ? `Booking for "${bookingToDispute.serviceTitle}"` : ''
                }
                onSubmit={orderToDispute ? handleOrderDisputeSubmit : handleBookingDisputeSubmit}
            />
            
            <FinancialModal isOpen={isFinancialModalOpen} onClose={() => setFinancialModalOpen(false)} mode={modalMode} onSuccess={() => refreshData()} />
            <TransferFundsModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} onSuccess={refreshData} />
            <ConfirmationModal
                isOpen={!!itemToCancel}
                onClose={() => setItemToCancel(null)}
                onConfirm={handleConfirmCancellation}
                title={`Cancel ${itemToCancel?.type === 'order' ? 'Order' : 'Booking'}`}
                message={`Are you sure you want to cancel this ${itemToCancel?.type}? If you have already paid, your funds will be refunded to your wallet.`}
                confirmButtonText="Yes, Cancel"
                confirmButtonClass="btn-danger"
            />
        </div>
    );
};

export default BuyerDashboard;