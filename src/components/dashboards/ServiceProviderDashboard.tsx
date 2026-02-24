import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
    mockGetListingsBySeller as getListingsBySeller, 
    mockGetBookingsByProvider as getBookingsByProvider, 
    mockUpdateBookingStatus as updateBookingStatus, 
    mockGetServiceAnalytics as getServiceAnalytics, 
    mockGetTransactions as getTransactions, 
    mockGetDisputesByUser as getDisputesByUser, 
    mockSubmitDisputeForBooking as submitDisputeForBooking, 
    mockGetFollowerUsers as getFollowerUsers, 
    mockGetFollowingUsers as getFollowingUsers, 
    mockGetSellerReviews as getSellerReviews,
    mockCancelBooking
} from '../../services/mockApi';
import type { Listing, Booking, Transaction, Dispute, User, SellerReview } from '../../types';
import Spinner from '../Spinner';
import EmptyState from '../EmptyState';
import { useNavigate, Link } from 'react-router-dom';
import ChatInterface from '../ChatInterface';
import VerificationStatusBanner from '../VerificationStatusBanner';
import VerificationForm from '../VerificationForm';
import { useRole } from '../../hooks/useRole';
import { useToast } from '../../contexts/ToastContext';
import BarChart from '../charts/BarChart';
import { TransactionType, BookingStatus, Role, TransactionStatus } from '../../constants';
import DisputeModal from '../DisputeModal';
import DisputeListItem from '../DisputeListItem';
import OnboardingTour, { type TourStep } from '../OnboardingTour';
import FinancialModal from '../FinancialModal';
import AIForecast from '../AIForecast';
import GenerateVideoModal from '../GenerateVideoModal';
import UserFollowCard from '../UserFollowCard';
import GrowthAdvisor from './GrowthAdvisor';
import AIMarketingToolkit from './AIMarketingToolkit';
import { useDashboardLayout } from '../../contexts/DashboardLayoutContext';
import DashboardGrid from './DashboardGrid';
import { useLanguage } from '../../contexts/LanguageContext';
import StarRating from '../StarRating';
import DashboardSkeleton from '../DashboardSkeleton';
import TransferFundsModal from '../TransferFundsModal';
import OnboardingChecklist from '../OnboardingChecklist';
import { exportToCsv } from '../../utils/csvExporter';
import ConfirmationModal from '../ConfirmationModal';

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


type Tab = 'overview' | 'services' | 'bookings' | 'analytics' | 'wallet' | 'verification' | 'messages' | 'disputes' | 'community' | 'reviews';

interface ServiceProviderDashboardProps {
  startTour?: boolean;
}

const ServiceProviderDashboard: React.FC<ServiceProviderDashboardProps> = ({ startTour = false }) => {
    const { user, updateUser } = useAuth();
    const { permissions } = useRole();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const { getLayout, updateLayout } = useDashboardLayout();
    const { t } = useLanguage();

    // Centralized data states
    const [services, setServices] = useState<Listing[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [reviews, setReviews] = useState<SellerReview[]>([]);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [followers, setFollowers] = useState<User[]>([]);
    const [following, setFollowing] = useState<User[]>([]);

    // UI states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const getTabKey = useCallback(() => `agroconnect_provider_tab_${user?.id}`, [user]);
    const [activeTab, setActiveTab] = useState<Tab>(() => (localStorage.getItem(getTabKey()) as Tab) || 'overview');
    
    useEffect(() => {
        if (user) localStorage.setItem(getTabKey(), activeTab);
    }, [activeTab, user, getTabKey]);

    const [isFinancialModalOpen, setFinancialModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'deposit' | 'withdraw'>('deposit');
    const [updatingStatusFor, setUpdatingStatusFor] = useState<string | null>(null);
    const [bookingToDispute, setBookingToDispute] = useState<Booking | null>(null);
    const [serviceForVideo, setServiceForVideo] = useState<Listing | null>(null);
    const [bookingToCancelItem, setBookingToCancelItem] = useState<{ id: string } | null>(null);

    const [showTour, setShowTour] = useState(false);
    const tourKey = user ? `tour_completed_provider_${user.id}` : '';

    const tourSteps: TourStep[] = [
        { target: '#provider-overview-stats', title: "Welcome, Provider!", content: "This is your performance snapshot. Track your active services, incoming bookings, and total earnings at a glance." },
        { target: '#provider-wallet-tab', title: "Your Wallet", content: "Manage your funds from the Wallet tab. Funds from completed services appear in 'Available Balance'." },
        { target: '#provider-services-tab', title: "List Your Services", content: "Ready to offer your skills? Go to your Services tab to add a new service listing." },
        { target: '#verification-banner', title: "Get Verified", content: "Complete your verification to build trust with clients and unlock all features. Click here or the 'Verification' tab to start." }
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
                bookingsData,
                transactionsData,
                disputesData,
                reviewsData,
                analytics,
                followersData,
                followingData,
            ] = await Promise.all([
                getListingsBySeller(user.id),
                getBookingsByProvider(user.id),
                getTransactions(user.id),
                getDisputesByUser(user.id),
                getSellerReviews(user.id),
                getServiceAnalytics(user.id),
                getFollowerUsers(user.id),
                getFollowingUsers(user.id),
            ]);
            
            setServices(listingsData.filter(l => l.isService));
            setBookings(bookingsData);
            setTransactions(transactionsData);
            setDisputes(disputesData);
            setReviews(reviewsData);
            setAnalyticsData(analytics);
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

    const handleUpdateBookingStatus = async (bookingId: string, status: BookingStatus) => {
        setUpdatingStatusFor(bookingId);
        try {
            await updateBookingStatus(bookingId, status);
            addToast(`Booking status updated to ${status}.`, 'success');
            refreshData();
        } catch (error: any) {
            addToast(error.message || 'Failed to update status.', 'error');
        } finally {
            setUpdatingStatusFor(null);
        }
    };
    
    const handleDisputeSubmit = async (reasonCategory: string, reasonMessage: string) => {
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

    const handleConfirmCancellation = async () => {
        if (!user || !bookingToCancelItem) return;
        try {
            await mockCancelBooking(bookingToCancelItem.id, user.id);
            addToast("Booking cancelled successfully.", "success");
            refreshData();
        } catch (err: any) {
            addToast(err.message || "Failed to cancel booking.", "error");
        } finally {
            setBookingToCancelItem(null);
        }
    };
    
    const serviceProviderOnboardingTasks = [
        { id: 'task_verify_sp', text: 'Get your identity verified', isCompleted: user?.verificationStatus === 'Verified' },
        { id: 'task_service', text: 'Create your first service listing', isCompleted: services.length > 0 },
        { id: 'task_phone_sp', text: 'Add your phone number', isCompleted: !!user?.phoneNumber },
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
    
    const getBookingStatusChip = (status: BookingStatus) => {
        const base = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
        const statusClasses: Record<BookingStatus, string> = {
            [BookingStatus.Pending]: 'bg-yellow-100 text-yellow-800',
            [BookingStatus.Confirmed]: 'bg-blue-100 text-blue-800',
            [BookingStatus.AwaitingPayment]: 'bg-orange-100 text-orange-800',
            [BookingStatus.Processing]: 'bg-indigo-100 text-indigo-800',
            [BookingStatus.AwaitingCompletion]: 'bg-purple-100 text-purple-800',
            [BookingStatus.Completed]: 'bg-green-100 text-green-800',
            [BookingStatus.Cancelled]: 'bg-gray-100 text-gray-800',
            [BookingStatus.Disputed]: 'bg-red-100 text-red-800',
        };
        return <span className={`${base} ${statusClasses[status]}`}>{status}</span>;
    };


    const renderContent = () => {
        switch (activeTab) {
            case 'overview': {
                 const dashboardKey = `provider_overview_${user?.id}`;
                const defaultLayout = ['checklist', 'stats', 'growth_advisor', 'marketing_toolkit'];
                
                const widgets: {[key: string]: {title: string; component: React.ReactNode}} = {
                     checklist: {
                        title: 'Getting Started',
                        component: <OnboardingChecklist tasks={serviceProviderOnboardingTasks} />
                    },
                    stats: {
                        title: 'Performance Snapshot',
                        component: (
                            <section id="provider-overview-stats" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <StatCard title="Active Services" value={services.length} icon="🛠️" />
                                <StatCard title="Pending Bookings" value={bookings.filter(b => b.status === BookingStatus.Pending).length} icon="🗓️" />
                                <StatCard title="Total Earnings" value={formatCurrency(user?.totalEarnings || 0)} icon="💰" />
                                <StatCard title="Followers" value={user?.followerCount || 0} icon="👥" />
                            </section>
                        )
                    },
                     growth_advisor: {
                        title: 'AI Growth Advisor',
                        component: user && <GrowthAdvisor sellerId={user.id} role={Role.ServiceProvider} />
                    },
                    marketing_toolkit: {
                        title: 'AI Marketing Toolkit',
                        component: user && <AIMarketingToolkit />
                    },
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
            case 'services':
                 return (
                    <section className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text">{t('tabServices')}</h2>
                             <div className="flex items-center gap-2">
                                <button onClick={() => exportToCsv('my_services.csv', services)} className="btn btn-secondary">Export to CSV</button>
                                <Link id="add-new-service-button" to="/listing/new" className={`btn btn-primary ${!permissions.canCreateListing ? 'opacity-50 cursor-not-allowed' : ''}`} title={!permissions.canCreateListing ? 'You must verify your identity to list an item' : ''} aria-disabled={!permissions.canCreateListing} onClick={(e) => !permissions.canCreateListing && e.preventDefault()}>
                                    + {t('addNewService')}
                                </Link>
                            </div>
                        </div>
                        {services.length > 0 ? (
                            <div className="space-y-4">
                                {services.map(service => (
                                    <div key={service.id} className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-slate-dark dark:text-dark-text">{service.title}</h3>
                                            <p className="text-sm text-gray-muted dark:text-dark-muted">{formatCurrency(service.price)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                             <button onClick={() => setServiceForVideo(service)} className="btn btn-sm btn-light">Generate Video</button>
                                            <Link to={`/listing/edit/${service.id}`} className="btn btn-sm btn-secondary">{t('edit')}</Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState icon="🛠️" title="No Services Yet" message="You haven't listed any services. Add your first service to get started." actionText={t('addNewService')} actionTo="/listing/new" />
                        )}
                    </section>
                );
             case 'bookings':
                 return (
                    <section className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text">{t('tabBookings')}</h2>
                             <button onClick={() => exportToCsv('my_bookings.csv', bookings)} className="btn btn-secondary">Export to CSV</button>
                        </div>
                        {bookings.length > 0 ? (
                            <div className="space-y-4">
                                {bookings.map(booking => (
                                    <div key={booking.id} className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                {booking.userProfileImage ? (
                                                     <img src={booking.userProfileImage} alt={booking.userName} className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{backgroundColor: getColorForName(booking.userName)}}>
                                                        {getInitials(booking.userName)}
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-semibold text-slate-dark dark:text-dark-text">{booking.serviceTitle}</h3>
                                                    <p className="text-sm text-gray-muted dark:text-dark-muted">With: {booking.userName} on {new Date(booking.bookingDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            {getBookingStatusChip(booking.status)}
                                        </div>
                                        <div className="mt-4 pt-4 border-t dark:border-dark-border flex justify-end gap-2">
                                            {booking.status === BookingStatus.Pending && (
                                                <>
                                                    <button 
                                                        onClick={() => setBookingToCancelItem({ id: booking.id })} 
                                                        className="btn btn-sm btn-danger" 
                                                        disabled={updatingStatusFor === booking.id}
                                                    >
                                                        Reject
                                                    </button>
                                                    <button onClick={() => handleUpdateBookingStatus(booking.id, BookingStatus.Confirmed)} className="btn btn-sm btn-primary" disabled={updatingStatusFor === booking.id}>Confirm</button>
                                                </>
                                            )}
                                            {booking.status === BookingStatus.Processing && (
                                                <button onClick={() => handleUpdateBookingStatus(booking.id, BookingStatus.AwaitingCompletion)} className="btn btn-sm btn-primary" disabled={updatingStatusFor === booking.id}>Mark as Complete</button>
                                            )}
                                            {[BookingStatus.Pending, BookingStatus.Processing, BookingStatus.AwaitingCompletion].includes(booking.status) && (
                                                <button onClick={() => setBookingToDispute(booking)} className="btn btn-sm btn-danger">Report Issue</button>
                                            )}
                                            {booking.status === BookingStatus.Disputed && (
                                                 <Link to={`/disputes/dispute_booking_${booking.id}`} className="btn btn-sm btn-danger">View Dispute</Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <EmptyState icon="🗓️" title="No Bookings Yet" message="You have no incoming or past bookings." />
                        )}
                    </section>
                );
            case 'analytics':
                 return (
                    <section className="animate-fade-in space-y-6">
                        <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text">{t('tabAnalytics')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <StatCard title="Total Earnings" value={formatCurrency(user?.totalEarnings || 0)} icon="💰" />
                             <StatCard title="Total Bookings" value={analyticsData?.totalBookings || 0} icon="🗓️" />
                        </div>
                         {user && <AIForecast sellerId={user.id} role={Role.ServiceProvider} />}
                        <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
                            <h3 className="font-semibold text-slate-dark dark:text-dark-text mb-2">Bookings (Last 30 Days)</h3>
                            <BarChart data={analyticsData?.bookingsLast30Days || {}} />
                        </div>
                        <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
                             <h3 className="font-semibold text-slate-dark dark:text-dark-text mb-2">Top 5 Services</h3>
                             <ul className="space-y-2">
                                {analyticsData?.topServices?.map((service: any) => (
                                    <li key={service.title} className="flex justify-between text-sm p-2 rounded-md bg-secondary dark:bg-dark-border">
                                        <span className="font-medium text-slate-dark dark:text-dark-text">{service.title}</span>
                                        <span className="text-gray-muted dark:text-dark-muted">{service.count} bookings</span>
                                    </li>
                                ))}
                             </ul>
                        </div>
                    </section>
                );
             case 'wallet':
                const pendingTransactions = transactions.filter(tx => tx.status === TransactionStatus.Pending);
                const completedTransactions = transactions.filter(tx => tx.status === TransactionStatus.Completed);

                return (
                     <section className="animate-fade-in">
                        <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text mb-6">{t('tabWallet')}</h2>
                         <div className="bg-secondary dark:bg-dark-surface/50 p-6 rounded-lg mb-8 border dark:border-dark-border">
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div className="flex gap-8">
                                    <div><p className="text-gray-muted dark:text-dark-muted text-sm uppercase tracking-wider font-bold">Available</p><p className="text-3xl font-extrabold text-primary-dark dark:text-primary-light">{formatCurrency(user?.accountBalance || 0)}</p></div>
                                    <div><p className="text-gray-muted dark:text-dark-muted text-sm uppercase tracking-wider font-bold">Pending</p><p className="text-3xl font-extrabold text-gray-muted dark:text-dark-muted">{formatCurrency(user?.pendingBalance || 0)}</p></div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openFinancialModal('deposit')} className="btn btn-primary">Deposit</button>
                                    <button onClick={() => setIsTransferModalOpen(true)} className="btn btn-secondary">Send Money</button>
                                    <button onClick={() => openFinancialModal('withdraw')} className="btn btn-light" disabled={!user?.phoneNumber || (user?.accountBalance || 0) === 0}>Withdraw</button>
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
                                    <span className={`font-black ${[TransactionType.Deposit, TransactionType.Sale].includes(tx.type) ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                    </span>
                                </div>
                            )) : (
                                <p className="text-center text-gray-muted py-8 bg-gray-50 dark:bg-dark-surface rounded-xl border-2 border-dashed dark:border-dark-border">No finalized transactions yet.</p>
                            )}
                         </div>
                     </section>
                );
            case 'verification':
                return (
                     <section className="animate-fade-in">
                        <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text mb-4">{t('tabVerification')}</h2>
                        <VerificationForm />
                    </section>
                );
            case 'messages':
                return (
                    <section className="animate-fade-in flex flex-col h-[65vh]">
                        <ChatInterface />
                    </section>
                );
            case 'disputes':
                 return (
                    <section className="animate-fade-in">
                        <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text mb-6">{t('tabDisputes')}</h2>
                        {disputes.length > 0 ? (
                            <div className="space-y-4">
                                {disputes.map(dispute => <DisputeListItem key={dispute.id} dispute={dispute} />)}
                            </div>
                        ) : ( <EmptyState icon="⚖️" title="No Disputes" message="You have no open or past disputes." />)}
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
                                ) : <EmptyState icon="👀" title="Not Following Anyone" message="Follow other users to see their updates." />}
                            </div>
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
                            <EmptyState icon="⭐" title="No Reviews Yet" message="When clients leave a review after a completed service, it will appear here." />
                        )}
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
             <nav id="provider-tabs-nav" className="flex flex-wrap gap-2 border-b dark:border-dark-border pb-4">
                <TabButton tab="overview" label={t('tabOverview')} />
                <TabButton tab="services" label={t('tabServices')} id="provider-services-tab" />
                <TabButton tab="bookings" label={t('tabBookings')} />
                <TabButton tab="community" label={t('tabCommunity')} />
                <TabButton tab="disputes" label={t('tabDisputes')} />
                <TabButton tab="analytics" label={t('tabAnalytics')} />
                <TabButton tab="wallet" label={t('tabWallet')} id="provider-wallet-tab" />
                <TabButton tab="verification" label={t('tabVerification')} />
                <TabButton tab="messages" label={t('tabMessages')} />
                <TabButton tab="reviews" label={t('tabReviews')} />
            </nav>
            {renderContent()}

            <FinancialModal isOpen={isFinancialModalOpen} onClose={() => setFinancialModalOpen(false)} mode={modalMode} onSuccess={() => refreshData()} />
            <TransferFundsModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} onSuccess={refreshData} />
            <DisputeModal
                isOpen={!!bookingToDispute}
                onClose={() => setBookingToDispute(null)}
                subjectId={bookingToDispute ? `Booking for "${bookingToDispute.serviceTitle}"` : ''}
                onSubmit={handleDisputeSubmit}
            />
            <GenerateVideoModal
                isOpen={!!serviceForVideo}
                onClose={() => setServiceForVideo(null)}
                listing={serviceForVideo}
                onSuccess={() => refreshData()}
            />
            <ConfirmationModal
                isOpen={!!bookingToCancelItem}
                onClose={() => setBookingToCancelItem(null)}
                onConfirm={handleConfirmCancellation}
                title="Reject Booking"
                message="Are you sure you want to reject this booking?"
                confirmButtonText="Yes, Reject"
                confirmButtonClass="btn-danger"
            />
        </div>
    );
};

export default ServiceProviderDashboard;