import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
    getListingsBySeller, 
    getTransactions, 
    getSellerAnalytics, 
    getOrdersBySeller, 
    updateOrderStatus, 
    deleteListing, 
    submitDispute, 
    getDisputesByUser, 
    getSellerReviews, 
    getNotifications, 
    getAgriculturalTasks, 
    getFollowerUsers, 
    getFollowingUsers,
    cancelOrder
} from '../../services/api';
import type { Listing, Transaction, Order, Dispute, SellerOrder, SellerReview, Notification, AgriculturalTask, User } from '../../types';
import { ListingStatus, TransactionType, OrderStatus, Role, TransactionStatus } from '../../constants';
import Spinner from '../Spinner';
import EmptyState from '../EmptyState';
import { useNavigate, Link } from 'react-router-dom';
import FinancialModal from '../FinancialModal';
import ChatInterface from '../ChatInterface';
import BarChart from '../charts/BarChart';
import OnboardingTour, { type TourStep } from '../OnboardingTour';
import VerificationStatusBanner from '../VerificationStatusBanner';
import VerificationForm from '../VerificationForm';
import { useRole } from '../../hooks/useRole';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationModal from '../ConfirmationModal';
import DisputeModal from '../DisputeModal';
import DisputeListItem from '../DisputeListItem';
import StarRating from '../StarRating';
import AIForecast from '../AIForecast';
import GenerateVideoModal from '../GenerateVideoModal';
import UserFollowCard from '../UserFollowCard';
import GrowthAdvisor from './GrowthAdvisor';
import AIMarketingToolkit from './AIMarketingToolkit';
import { useDashboardLayout } from '../../contexts/DashboardLayoutContext';
import DashboardGrid from './DashboardGrid';
import { useLanguage } from '../../contexts/LanguageContext';
import DashboardSkeleton from '../DashboardSkeleton';
import TransferFundsModal from '../TransferFundsModal';
import OnboardingChecklist from '../OnboardingChecklist';
import { exportToCsv } from '../../utils/csvExporter';

type Tab = 'overview' | 'listings' | 'orders' | 'verification' | 'analytics' | 'messages' | 'wallet' | 'disputes' | 'reviews' | 'notifications' | 'community';

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


interface FarmerDashboardProps {
  startTour?: boolean;
}

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ startTour = false }) => {
    const { user, updateUser } = useAuth();
    const { permissions } = useRole();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const { getLayout, updateLayout } = useDashboardLayout();
    const { t } = useLanguage();
    
    // Centralized data states
    const [listings, setListings] = useState<Listing[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [reviews, setReviews] = useState<SellerReview[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [monthlyTasks, setMonthlyTasks] = useState<AgriculturalTask[]>([]);
    const [followers, setFollowers] = useState<User[]>([]);
    const [following, setFollowing] = useState<User[]>([]);
    
    // UI states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const getTabKey = useCallback(() => `agroconnect_farmer_tab_${user?.id}`, [user]);
    const [activeTab, setActiveTab] = useState<Tab>(() => (localStorage.getItem(getTabKey()) as Tab) || 'overview');
    
    useEffect(() => {
        if (user) localStorage.setItem(getTabKey(), activeTab);
    }, [activeTab, user, getTabKey]);

    const [isFinancialModalOpen, setFinancialModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'deposit' | 'withdraw'>('deposit');
    const [updatingStatusFor, setUpdatingStatusFor] = useState<string | null>(null);
    const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
    const [orderToDispute, setOrderToDispute] = useState<{ order: Order; sellerOrder: SellerOrder } | null>(null);
    const [listingForVideo, setListingForVideo] = useState<Listing | null>(null);
    const [orderToCancelItem, setOrderToCancelItem] = useState<{ id: string } | null>(null);

    const [showTour, setShowTour] = useState(false);
    const tourKey = user ? `tour_completed_farmer_${user.id}` : '';

    const tourSteps: TourStep[] = [
        {
            target: '#farmer-overview-stats',
            title: "Welcome, Farmer!",
            content: "This is your performance snapshot. Track your active listings, incoming orders, and total earnings at a glance."
        },
        {
            target: '#farmer-wallet-tab',
            title: "Your Wallet",
            content: "Manage your funds from the Wallet tab. Funds from completed orders appear in 'Available Balance', and you can deposit or withdraw from here."
        },
        {
            target: '#user-profile-menu-button',
            title: "Profile & Settings",
            content: "Click here to access your profile settings, where you can update your personal information, change your password, and manage your account."
        },
        {
            target: '#farmer-tabs-nav',
            title: "Management Tools",
            content: "Use these tabs to manage every aspect of your store, from listings and orders to your finances and community presence."
        },
        {
            target: '#farmer-listings-tab',
            title: "List Your Products",
            content: "Ready to sell? Go to your Listings tab to add your first product. Our AI assistant can even help you write the description!"
        },
        {
            target: '#verification-banner',
            title: "Get Verified",
            content: "Complete your verification to build trust with buyers and unlock all selling features. Click this banner or the 'Verification' tab to get started."
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
             const [
                listingsData,
                ordersData,
                transactionsData,
                disputesData,
                reviewsData,
                notificationsData,
                analytics,
                tasksData,
                followersData,
                followingData,
            ] = await Promise.all([
                getListingsBySeller(user.id),
                getOrdersBySeller(user.id),
                getTransactions(user.id),
                getDisputesByUser(user.id),
                getSellerReviews(user.id),
                getNotifications(user.id),
                getSellerAnalytics(user.id),
                getAgriculturalTasks({ month: new Date().getMonth() + 1, region: user.location }),
                getFollowerUsers(user.id),
                getFollowingUsers(user.id),
            ]);
            
            setListings(listingsData.filter(l => !l.isService));
            setOrders(ordersData);
            setTransactions(transactionsData);
            setDisputes(disputesData);
            setReviews(reviewsData);
            setNotifications(notificationsData);
            setAnalyticsData(analytics);
            setMonthlyTasks(tasksData);
            setFollowers(followersData);
            setFollowing(followingData);

        } catch (err: any) {
            setError(err.message || "Failed to load dashboard data.");
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

    const handleUpdateStatus = async (orderId: string, status: OrderStatus, successMessage: string) => {
        if (!user) return;
        setUpdatingStatusFor(orderId);
        try {
            await updateOrderStatus(orderId, user.id, status);
            addToast(successMessage, "success");
            refreshData();
        } catch (error: any) {
            addToast(error.message || "Failed to update order status.", "error");
        } finally {
            setUpdatingStatusFor(null);
        }
    };

    const handleMarkAsShipped = (orderId: string) => {
        handleUpdateStatus(orderId, OrderStatus.Shipped, "Order marked as shipped! The buyer has been notified.");
    };

    const handleMarkAsDelivered = (orderId: string) => {
        handleUpdateStatus(orderId, OrderStatus.Delivered, "Order marked as delivered! Awaiting buyer confirmation.");
    };
    
    const handleDeleteListing = async () => {
        if (!listingToDelete) return;
        try {
            await deleteListing(listingToDelete.id);
            addToast(`Listing "${listingToDelete.title}" deleted successfully.`, 'success');
            setListingToDelete(null);
            refreshData();
        } catch (error: any) {
            addToast(error.message || "Failed to delete listing.", "error");
        }
    };
    
    const handleDisputeSubmit = async (reasonCategory: string, reasonMessage: string) => {
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

    const handleConfirmCancellation = async () => {
        if (!user || !orderToCancelItem) return;
        try {
            await cancelOrder(orderToCancelItem.id, user.id, user.id);
            addToast("Order cancelled. If the buyer had already paid, they have been refunded.", "success");
            refreshData();
        } catch (err: any) {
            addToast(err.message || "Failed to cancel order.", "error");
        } finally {
            setOrderToCancelItem(null);
        }
    };
    
    const farmerOnboardingTasks = [
        { id: 'task_verify', text: 'Get your identity verified', isCompleted: user?.verificationStatus === 'Verified' },
        { id: 'task_listing', text: 'Create your first listing', isCompleted: listings.length > 0 },
        { id: 'task_phone', text: 'Add your phone number', isCompleted: !!user?.phoneNumber },
    ];


    if (loading) return <DashboardSkeleton />;
    if (error) return <div className="text-center p-10 bg-red-50 text-red-700 rounded-lg">{error}</div>;

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

    const TabButton: React.FC<{ tab: Tab, label: string, id?: string }> = ({ tab, label, id }) => (
        <button id={id} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'text-slate-dark dark:text-dark-text hover:bg-secondary dark:hover:bg-dark-border'}`}>
            {label}
        </button>
    );

    const getStatusChip = (status: OrderStatus) => {
        const base = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
        switch(status) {
            case OrderStatus.Processing: return `${base} bg-yellow-100 text-yellow-800`;
            case OrderStatus.Shipped: return `${base} bg-blue-100 text-blue-800`;
            case OrderStatus.Delivered: return `${base} bg-indigo-100 text-indigo-800`;
            case OrderStatus.Completed: return `${base} bg-green-100 text-green-800`;
            case OrderStatus.Cancelled: return `${base} bg-red-100 text-red-800`;
            case OrderStatus.Disputed: return `${base} bg-red-100 text-red-800`;
            default: return `${base} bg-gray-100 text-gray-800`;
        }
    };


    const renderContent = () => {
        switch (activeTab) {
            case 'overview': {
                const dashboardKey = `farmer_overview_${user?.id}`;
                const defaultLayout = ['checklist', 'stats', 'growth_advisor', 'marketing_toolkit', 'calendar_preview'];
                
                const widgets: {[key: string]: {title: string; component: React.ReactNode}} = {
                     checklist: {
                        title: 'Getting Started',
                        component: <OnboardingChecklist tasks={farmerOnboardingTasks} />
                    },
                    stats: {
                        title: 'Performance Snapshot',
                        component: (
                            <section id="farmer-overview-stats" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <StatCard title="Active Listings" value={listings.filter(l => l.status === ListingStatus.Active).length} icon="📦" />
                                <StatCard title="Incoming Orders" value={orders.filter(o => o.sellerOrders.some(so => so.sellerId === user?.id && so.status === 'Processing')).length} icon="🚚" />
                                <StatCard title="Total Earnings" value={formatCurrency(user?.totalEarnings || 0)} icon="💰" />
                                <StatCard title="Followers" value={user?.followerCount || 0} icon="👥" />
                            </section>
                        )
                    },
                    growth_advisor: {
                        title: 'AI Growth Advisor',
                        component: user && <GrowthAdvisor sellerId={user.id} role={Role.Farmer} />
                    },
                    marketing_toolkit: {
                        title: 'AI Marketing Toolkit',
                        component: user && <AIMarketingToolkit />
                    },
                    calendar_preview: {
                        title: 'Quick-Look Calendar',
                        component: (
                             <div className="flex flex-col h-full">
                                <p className="text-sm text-gray-muted dark:text-dark-muted mb-4 border-b dark:border-dark-border pb-2">
                                    Tasks for {new Date().toLocaleString('default', { month: 'long' })} in {user?.location || 'your region'}.
                                </p>
                                {monthlyTasks.length > 0 ? (
                                    <ul className="space-y-2 text-sm flex-grow">
                                        {monthlyTasks.slice(0, 3).map(task => (
                                            <li key={task.id} className="flex items-start gap-2 p-2 bg-secondary dark:bg-dark-border rounded-md">
                                                <span className="text-xl pt-1">{task.icon}</span>
                                                <div>
                                                    <p className="font-medium text-slate-dark dark:text-dark-text">{task.task}</p>
                                                    <p className="text-xs text-gray-muted dark:text-dark-muted">{task.crop}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-center text-gray-muted dark:text-dark-muted py-4 flex-grow">No specific tasks for your region this month.</p>
                                )}
                                <Link to="/seasonal-calendar" className="text-primary font-semibold hover:underline text-sm mt-4 block text-center">
                                    View Full Calendar →
                                </Link>
                            </div>
                        )
                    }
                };

                return (
                    <DashboardGrid
                        dashboardKey={dashboardKey}
                        widgets={widgets}
                        layout={getLayout(dashboardKey, defaultLayout)}
                        onLayoutChange={(newLayout) => updateLayout(dashboardKey, newLayout)}
                    />
                );
            }
            case 'listings':
                return (
                    <section className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text">{t('tabListings')}</h2>
                             <div className="flex items-center gap-2">
                                <button onClick={() => exportToCsv('my_listings.csv', listings)} className="btn btn-secondary">Export to CSV</button>
                                <Link id="add-new-listing-button" to="/listing/new" className={`btn btn-primary ${!permissions.canCreateListing ? 'opacity-50 cursor-not-allowed' : ''}`} title={!permissions.canCreateListing ? 'You must verify your identity to list an item' : ''} aria-disabled={!permissions.canCreateListing} onClick={(e) => !permissions.canCreateListing && e.preventDefault()}>
                                    + {t('addNewListing')}
                                </Link>
                            </div>
                        </div>
                        {listings.length > 0 ? (
                            <div className="space-y-4">
                                {listings.map(listing => (
                                    <div key={listing.id} className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md flex items-center justify-between flex-wrap gap-4">
                                        <div className="flex items-center gap-4">
                                            <img src={listing.images[0]?.url} alt={listing.title} className="w-16 h-16 rounded-md object-cover" />
                                            <div>
                                                <h3 className="font-semibold text-slate-dark dark:text-dark-text">{listing.title}</h3>
                                                <p className="text-sm text-gray-muted dark:text-dark-muted">{formatCurrency(listing.price)} - Stock: {listing.stock}</p>
                                                <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${listing.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{listing.status}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setListingForVideo(listing)} className="btn btn-sm btn-light">Generate Video</button>
                                            <Link to={`/listing/edit/${listing.id}`} className="btn btn-sm btn-secondary">{t('edit')}</Link>
                                            <button onClick={() => setListingToDelete(listing)} className="btn btn-sm btn-danger">{t('delete')}</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState icon="📦" title="No Listings Yet" message="You haven't listed any products for sale. Add your first product to get started." actionText={t('addNewListing')} actionTo="/listing/new" />
                        )}
                    </section>
                );
            case 'orders':
                const sellerOrders = orders.map(order => ({ order, sellerOrder: order.sellerOrders.find(so => so.sellerId === user?.id) })).filter(item => item.sellerOrder);

                return (
                    <section className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text">{t('tabOrders')}</h2>
                            <button onClick={() => exportToCsv('my_orders.csv', sellerOrders.map(o => ({...o.order, ...o.sellerOrder})))} className="btn btn-secondary">Export to CSV</button>
                        </div>
                        {sellerOrders.length > 0 ? (
                            <div className="space-y-4">
                                {sellerOrders.map(({ order, sellerOrder }) => {
                                    if (!sellerOrder) return null;
                                    return (
                                        <div key={order.id + sellerOrder.sellerId} className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
                                            <div className="flex justify-between items-start flex-wrap gap-2">
                                                <div className="flex items-center gap-3">
                                                    {order.buyerInfo.profileImage ? (
                                                        <img src={order.buyerInfo.profileImage} alt={order.buyerInfo.name} className="w-10 h-10 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{backgroundColor: getColorForName(order.buyerInfo.name)}}>
                                                            {getInitials(order.buyerInfo.name)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h3 className="font-semibold text-slate-dark dark:text-dark-text">Order #{order.id.slice(-6)}</h3>
                                                        <p className="text-sm text-gray-muted dark:text-dark-muted">From: {order.buyerInfo.name}</p>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-primary">{formatCurrency(sellerOrder.subTotal)}</span>
                                            </div>
                                            <div className="mt-4 pt-4 border-t dark:border-dark-border">
                                                <p className="font-semibold text-sm">My Items:</p>
                                                <ul className="list-disc list-inside text-sm text-gray-muted dark:text-dark-muted">
                                                    {sellerOrder.items.map(item => <li key={item.listing.id}>{item.listing.title} (Qty: {item.quantity})</li>)}
                                                </ul>
                                            </div>
                                            <div className="mt-4 pt-4 border-t dark:border-dark-border flex justify-between items-center">
                                                <span className={getStatusChip(sellerOrder.status)}>{sellerOrder.status}</span>
                                                <div className="flex gap-2">
                                                    {sellerOrder.status === OrderStatus.Processing && (
                                                        <>
                                                            <button onClick={() => handleMarkAsShipped(order.id)} className="btn btn-sm btn-primary" disabled={updatingStatusFor === order.id}>
                                                                {updatingStatusFor === order.id ? <Spinner size="sm"/> : 'Mark as Shipped'}
                                                            </button>
                                                            <button 
                                                                onClick={() => setOrderToCancelItem({ id: order.id })} 
                                                                className="btn btn-sm btn-danger"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    )}
                                                    {sellerOrder.status === OrderStatus.Shipped && (
                                                        <button onClick={() => handleMarkAsDelivered(order.id)} className="btn btn-sm btn-light" disabled={updatingStatusFor === order.id}>
                                                            {updatingStatusFor === order.id ? <Spinner size="sm"/> : 'Mark as Delivered'}
                                                        </button>
                                                    )}
                                                    {(sellerOrder.status === 'Processing' || sellerOrder.status === 'Shipped') && (
                                                        <button onClick={() => setOrderToDispute({ order, sellerOrder: sellerOrder })} className="btn btn-sm btn-danger">Report Issue</button>
                                                    )}
                                                    {sellerOrder.status === 'Disputed' && (
                                                        <Link to={`/disputes/dispute_${order.id}_${sellerOrder.sellerId}`} className="btn btn-sm btn-danger">View Dispute</Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyState icon="🚚" title="No Incoming Orders" message="You don't have any new orders at the moment. Your active listings are visible in the marketplace." />
                        )}
                    </section>
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
            case 'verification':
                return (
                     <section className="animate-fade-in">
                        <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text mb-4">{t('tabVerification')}</h2>
                        <VerificationForm />
                    </section>
                );
            case 'analytics':
                 return (
                    <section className="animate-fade-in space-y-6">
                        <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text">{t('tabAnalytics')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <StatCard title="Total Revenue" value={formatCurrency(user?.totalEarnings || 0)} icon="💰" />
                             <StatCard title="Total Orders" value={analyticsData?.totalOrders || 0} icon="🛒" />
                        </div>
                        {user && <AIForecast sellerId={user.id} role={Role.Farmer} />}
                        <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
                            <h3 className="font-semibold text-slate-dark dark:text-dark-text mb-2">Sales (Last 30 Days)</h3>
                            <BarChart data={analyticsData?.salesLast30Days || {}} />
                        </div>
                        <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
                             <h3 className="font-semibold text-slate-dark dark:text-dark-text mb-2">Top 5 Products</h3>
                             <ul className="space-y-2">
                                {analyticsData?.topProducts?.map((prod: any) => (
                                    <li key={prod.title} className="flex justify-between text-sm p-2 rounded-md bg-secondary dark:bg-dark-border">
                                        <span className="font-medium text-slate-dark dark:text-dark-text">{prod.title}</span>
                                        <span className="text-gray-muted dark:text-dark-muted">{formatCurrency(prod.sales)} ({prod.units} units)</span>
                                    </li>
                                ))}
                             </ul>
                        </div>
                    </section>
                );
            case 'messages':
                return (
                    <section className="animate-fade-in flex flex-col h-[65vh]">
                        <ChatInterface />
                    </section>
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
                         <div id="farmer-wallet-section" className="bg-secondary dark:bg-dark-surface/50 p-6 rounded-lg mb-8 border dark:border-dark-border">
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div className="flex gap-8">
                                    <div><p className="text-gray-muted dark:text-dark-muted text-sm uppercase tracking-wider font-bold">Available</p><p className="text-3xl font-extrabold text-primary-dark dark:text-primary-light">{formatCurrency(user?.accountBalance || 0)}</p></div>
                                    <div><p className="text-gray-muted dark:text-dark-muted text-sm uppercase tracking-wider font-bold">Pending</p><p className="text-3xl font-extrabold text-gray-muted dark:text-dark-muted">{formatCurrency(user?.pendingBalance || 0)}</p></div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openFinancialModal('deposit')} className="btn btn-primary">Deposit</button>
                                    <button onClick={() => setIsTransferModalOpen(true)} className="btn btn-secondary">Send Money</button>
                                    <button onClick={() => openFinancialModal('withdraw')} className="btn btn-light" disabled={!user?.phoneNumber || (user?.accountBalance || 0) === 0} title={!user?.phoneNumber ? "Please add a phone number to your profile to withdraw" : ""}>Withdraw</button>
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
                                                <p className={`font-black ${[TransactionType.Deposit, TransactionType.Sale, TransactionType.Transfer].includes(tx.type) && tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                                    <span className={`font-black ${[TransactionType.Deposit, TransactionType.Sale, TransactionType.Transfer].includes(tx.type) && tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                    </span>
                                </div>
                            )) : (
                                <p className="text-center text-gray-muted py-8 bg-gray-50 dark:bg-dark-surface rounded-xl border-2 border-dashed dark:border-dark-border">No finalized transactions yet.</p>
                            )}
                         </div>
                     </section>
                );
            case 'reviews':
                return (
                    <section className="animate-fade-in">
                        <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text mb-6">{t('tabReviews')}</h2>
                        {reviews.length > 0 ? (
                            <div className="space-y-4">
                                {reviews.map(review => (
                                    <div key={review.id} className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
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
                            <EmptyState icon="⭐" title="No Reviews Yet" message="When buyers leave a review after a completed order, it will appear here." />
                        )}
                    </section>
                );
            case 'notifications':
                 return (
                    <section className="animate-fade-in">
                        <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text mb-6">{t('notifications')}</h2>
                        {notifications.length > 0 ? (
                            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-md overflow-hidden">
                                <ul className="divide-y divide-gray-200 dark:divide-dark-border">
                                    {notifications.map(n => (
                                        <li key={n.id} className={`${!n.isRead ? 'bg-primary-light/30' : ''} hover:bg-secondary dark:hover:bg-dark-border`}>
                                            <Link to={n.link} className="block p-4">
                                                <p className="text-sm">{n.message}</p>
                                                <p className="text-xs text-gray-muted mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                           <EmptyState icon="🔔" title="No Notifications" message="You don't have any notifications right now." />
                        )}
                    </section>
               );
            case 'community':
                return (
                    <section className="animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text mb-4">My Followers ({followers.length})</h2>
                                {followers.length > 0 ? (
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                        {followers.map(follower => <UserFollowCard key={follower.id} user={follower} />)}
                                    </div>
                                ) : <EmptyState icon="👥" title="No Followers Yet" message="When other users follow you, they will appear here." />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text mb-4">I Am Following ({following.length})</h2>
                                {following.length > 0 ? (
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                        {following.map(followedUser => <UserFollowCard key={followedUser.id} user={followedUser} />)}
                                    </div>
                                ) : <EmptyState icon="👀" title="Not Following Anyone" message="Follow other sellers to see their updates and new products." />}
                            </div>
                        </div>
                    </section>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-8">
            <OnboardingTour steps={tourSteps} isOpen={showTour} onClose={handleTourFinish} />
            <div id="verification-banner">
                <VerificationStatusBanner status={user?.verificationStatus} onVerifyClick={() => setActiveTab('verification')} />
            </div>

            <nav id="farmer-tabs-nav" className="flex flex-wrap gap-2 border-b dark:border-dark-border pb-4">
                <TabButton tab="overview" label={t('tabOverview')} />
                <TabButton tab="listings" label={t('tabListings')} id="farmer-listings-tab" />
                <TabButton tab="orders" label={t('tabOrders')} />
                <TabButton tab="community" label={t('tabCommunity')} />
                <TabButton tab="disputes" label={t('tabDisputes')} />
                <TabButton tab="analytics" label={t('tabAnalytics')} />
                <TabButton tab="wallet" label={t('tabWallet')} id="farmer-wallet-tab" />
                <TabButton tab="verification" label={t('tabVerification')} />
                <TabButton tab="messages" label={t('tabMessages')} />
                <TabButton tab="reviews" label={t('tabReviews')} />
                <TabButton tab="notifications" label={t('notifications')} />
            </nav>
            {renderContent()}

            <FinancialModal isOpen={isFinancialModalOpen} onClose={() => setFinancialModalOpen(false)} mode={modalMode} onSuccess={() => refreshData()} />
            <TransferFundsModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} onSuccess={refreshData} />
            <ConfirmationModal
                isOpen={!!listingToDelete}
                onClose={() => setListingToDelete(null)}
                onConfirm={handleDeleteListing}
                title="Confirm Deletion"
                message={`Are you sure you want to delete "${listingToDelete?.title}"? This action cannot be undone.`}
            />
             <DisputeModal
                isOpen={!!orderToDispute}
                onClose={() => setOrderToDispute(null)}
                subjectId={orderToDispute ? `Order #${orderToDispute.order.id.slice(-6)} (Seller: ${orderToDispute.sellerOrder.sellerName})` : ''}
                onSubmit={handleDisputeSubmit}
            />
            <GenerateVideoModal
                isOpen={!!listingForVideo}
                onClose={() => setListingForVideo(null)}
                listing={listingForVideo}
                onSuccess={() => refreshData()}
            />
            <ConfirmationModal
                isOpen={!!orderToCancelItem}
                onClose={() => setOrderToCancelItem(null)}
                onConfirm={handleConfirmCancellation}
                title="Cancel Incoming Order"
                message="Are you sure you want to cancel this order? If the buyer has already paid, they will be automatically refunded."
                confirmButtonText="Yes, Cancel"
                confirmButtonClass="btn-danger"
            />
        </div>
    );
};

export default FarmerDashboard;