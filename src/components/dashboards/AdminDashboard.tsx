
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { User, Listing, Dispute, Order, Transaction, ActivityLog, Session, SecurityAlert, CommissionPayout, FlaggedContent, Article, SellerOrder } from '../../types';
import { Role, ListingStatus, DisputeStatus, VerificationTier, OrderStatus, VerificationStatus } from '../../constants';
/* Fix: Added getAllDisputes to the import list below */
import { 
    getListings, 
    getAllUsers, 
    getPendingVerifications, 
    getOrders, 
    getActivityLogs, 
    getSecurityAlerts, 
    getFlaggedContent, 
    getArticles,
    updateListing,
    apiUpdateUserProfile,
    updateUserStatus,
    updateUserRole,
    deleteUser,
    deleteListing,
    getSessionsForUser,
    terminateSession,
    dismissSecurityAlert,
    resolveFlaggedContent,
    createArticle,
    updateArticle,
    deleteArticle,
    getPlatformAnalytics,
    getPlatformFinancials,
    withdrawCommission,
    deleteForumContent,
    getPlatformHealth,
    triageFlaggedContent,
    mockGetPlatformSettings,
    mockUpdatePlatformSettings,
    getUserById_Admin as getUserById,
    resolveDispute,
    updateOrderStatus,
    getAllDisputes
} from '../../services/api';
import Spinner from '../Spinner';
import UserDetailsModal from '../UserDetailsModal';
import ConfirmationModal from '../ConfirmationModal';
import RoleManagementModal from '../RoleManagementModal';
import VerificationManagementModal from '../VerificationManagementModal';
import UserSessionsModal from '../UserSessionsModal';
import { Link } from 'react-router-dom';
import CameroonMap from '../CameroonMap';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useRole } from '../../hooks/useRole';
import ArticleEditorModal from '../ArticleEditorModal';
import PlatformHealthMonitor from './PlatformHealthMonitor';
import ModerationQueue from './ModerationQueue';
import { useDashboardLayout } from '../../contexts/DashboardLayoutContext';
import DashboardGrid from './DashboardGrid';
import { useLanguage } from '../../contexts/LanguageContext';
import DashboardSkeleton from '../DashboardSkeleton';
import BarChart from '../charts/BarChart';
import { getRegionFromCity } from '../../services/locationData';

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


type Tab = 'analytics' | 'users' | 'listings' | 'verifications' | 'disputes' | 'orders' | 'logs' | 'security' | 'map' | 'finances' | 'content' | 'moderation' | 'platform';

interface AdminDashboardProps {
  defaultTab?: Tab;
}

const AdminOrderDetailsModal: React.FC<{ order: Order | null; onClose: () => void; onStatusUpdate: (orderId: string, sellerId: string, status: OrderStatus) => void }> = ({ order, onClose, onStatusUpdate }) => {
    if (!order) return null;

    const formatCurrency = (amount: number) => `XAF ${amount.toLocaleString('fr-CM')}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl">&times;</button>
                
                <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-4">Order Details #{order.id.slice(-6)}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-6 border-b dark:border-dark-border">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Buyer Information</h3>
                        <p className="font-bold">{order.buyerInfo.name}</p>
                        <p className="text-sm text-gray-muted">ID: {order.buyerInfo.id}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Order Summary</h3>
                        <p className="text-sm">Placed on: {new Date(order.createdAt).toLocaleString()}</p>
                        <p className="text-sm">Delivery: {order.deliveryMethod} ({formatCurrency(order.deliveryCost)})</p>
                        <p className="text-lg font-bold text-primary mt-1">Total: {formatCurrency(order.totalPrice)}</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {order.sellerOrders.map((so) => (
                        <div key={so.sellerId} className="bg-secondary dark:bg-dark-border p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-slate-dark dark:text-white">Seller: {so.sellerName}</h4>
                                    <p className="text-xs text-gray-muted">ID: {so.sellerId}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold mb-1">Current Status:</p>
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                        so.status === OrderStatus.Completed ? 'bg-green-100 text-green-800' :
                                        so.status === OrderStatus.Cancelled ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {so.status}
                                    </span>
                                </div>
                            </div>

                            <ul className="space-y-2 mb-6 bg-white dark:bg-dark-surface p-3 rounded-md border dark:border-dark-border">
                                {so.items.map((item, idx) => (
                                    <li key={idx} className="flex justify-between text-sm">
                                        <span>{item.listing.title} x {item.quantity}</span>
                                        <span className="font-medium">{formatCurrency(item.listing.price * item.quantity)}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-4 border-t dark:border-dark-border">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-3">Admin Overide Status</p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.values(OrderStatus).map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => onStatusUpdate(order.id, so.sellerId, status)}
                                            disabled={so.status === status}
                                            className={`btn btn-xs ${so.status === status ? 'btn-primary' : 'btn-secondary'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-4 border-t dark:border-dark-border flex justify-end">
                    <button onClick={onClose} className="btn btn-primary">Close</button>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ defaultTab = 'analytics' }) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const { permissions } = useRole();
    const { getLayout, updateLayout } = useDashboardLayout();
    const { t } = useLanguage();
    const getTabKey = useCallback(() => `agroconnect_admin_tab_${user?.id}`, [user]);

    const [activeTab, setActiveTab] = useState<Tab>(() => {
        if (!user) return defaultTab;
        return (localStorage.getItem(getTabKey()) as Tab) || defaultTab;
    });

    const [loading, setLoading] = useState(true);
    
    // Centralized state for all dashboard data
    const [analytics, setAnalytics] = useState<any>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [listings, setListings] = useState<Listing[]>([]);
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
    const [platformFinances, setPlatformFinances] = useState<{ escrowBalance: number; commissionBalance: number; payouts: CommissionPayout[] } | null>(null);
    const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    
    // Platform Settings State
    const [platformSettings, setPlatformSettings] = useState<{ logoUrl: string }>({ logoUrl: '' });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userToManage, setUserToManage] = useState<User | null>(null);
    const [userToVerify, setUserToVerify] = useState<User | null>(null);
    const [userToViewSessions, setUserToViewSessions] = useState<User | null>(null);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const [actionToConfirm, setActionToConfirm] = useState<'suspend' | 'deleteUser' | 'deleteListing' | 'deleteFlaggedContent' | 'suspendFlaggedUser' | 'deleteArticle' | null>(null);
    const [itemToConfirm, setItemToConfirm] = useState<User | Listing | FlaggedContent | Article | null>(null);

    const [logUserFilter, setLogUserFilter] = useState('');
    const [logActionFilter, setLogActionFilter] = useState('');
    const [listingFilter, setListingFilter] = useState<ListingStatus | 'All'>(ListingStatus.Pending);
    const [verificationFilter, setVerificationFilter] = useState<VerificationStatus | 'All'>(VerificationStatus.Pending);
    
    const [commissionWithdrawAmount, setCommissionWithdrawAmount] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    
    const [isArticleEditorOpen, setIsArticleEditorOpen] = useState(false);
    const [articleToEdit, setArticleToEdit] = useState<Article | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [
                analyticsData,
                usersData,
                listingsData,
                disputesData,
                ordersData,
                activityLogsData,
                securityAlertsData,
                platformFinancesData,
                flaggedContentData,
                articlesData,
                settingsData
            ] = await Promise.all([
                getPlatformAnalytics(),
                getAllUsers(),
                getListings(),
                getAllDisputes(), 
                getOrders('all'),
                getActivityLogs(),
                getSecurityAlerts(),
                getPlatformFinancials(),
                getFlaggedContent ? getFlaggedContent() : Promise.resolve([]),
                getArticles(),
                mockGetPlatformSettings()
            ]);

            setAnalytics(analyticsData);
            setUsers(usersData);
            setListings(listingsData);
            setDisputes(disputesData);
            setOrders(ordersData);
            setActivityLogs(activityLogsData);
            setSecurityAlerts(securityAlertsData);
            setPlatformFinances(platformFinancesData);
            setFlaggedContent(flaggedContentData);
            setArticles(articlesData);
            setPlatformSettings(settingsData);

        } catch (error) {
            console.error(error);
            addToast(`Failed to load dashboard data.`, 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        if (user) localStorage.setItem(getTabKey(), activeTab);
    }, [activeTab, user, getTabKey]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const refreshData = useCallback(() => {
        fetchData();
    }, [fetchData]);
    
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setPlatformSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleSavePlatformSettings = async () => {
        setIsSavingSettings(true);
        try {
            await mockUpdatePlatformSettings(platformSettings);
            addToast("Platform settings updated successfully.", "success");
        } catch (error: any) {
            addToast(error.message || "Failed to update settings.", "error");
        } finally {
            setIsSavingSettings(false);
        }
    };
    
    const handleUpdateListingStatus = async (listingId: string, status: ListingStatus) => {
        await updateListing(listingId, { status });
        refreshData();
    };

    const handleUpdateOrderStatus = async (orderId: string, sellerId: string, status: OrderStatus) => {
        try {
            await updateOrderStatus(orderId, sellerId, status);
            addToast(`Order status updated successfully.`, 'success');
            refreshData();
            // Re-fetch or local update selectedOrder to show latest in modal
            const updatedOrders = await getOrders('all');
            const found = updatedOrders.find((o: Order) => o.id === orderId);
            if (found) setSelectedOrder(found);
        } catch (error: any) {
            addToast(error.message || 'Failed to update order status.', 'error');
        }
    };

    const handleConfirmAction = async () => {
        if (!itemToConfirm) return;

        try {
            switch (actionToConfirm) {
                case 'suspend':
                    const user = itemToConfirm as User;
                    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
                    await updateUserStatus(user.id, newStatus);
                    addToast(`User ${newStatus.toLowerCase()}.`, 'success');
                    refreshData();
                    break;
                case 'deleteUser':
                    await deleteUser((itemToConfirm as User).id);
                    addToast(`User deleted.`, 'success');
                    refreshData();
                    break;
                case 'deleteListing':
                     await deleteListing((itemToConfirm as Listing).id);
                     addToast(`Listing deleted.`, 'success');
                     refreshData();
                    break;
                case 'deleteFlaggedContent':
                    const flagToDelete = itemToConfirm as FlaggedContent;
                    await deleteForumContent(flagToDelete.contentId, flagToDelete.contentType as 'post' | 'reply');
                    await resolveFlaggedContent(flagToDelete.id);
                    addToast(`Content deleted and flag resolved.`, 'success');
                    refreshData();
                    break;
                case 'suspendFlaggedUser':
                    const flagToSuspend = itemToConfirm as FlaggedContent;
                    await updateUserStatus(flagToSuspend.contentId, 'Suspended');
                    await resolveFlaggedContent(flagToSuspend.id);
                    addToast(`User suspended and flag resolved.`, 'success');
                    refreshData();
                    break;
                case 'deleteArticle':
                    await deleteArticle((itemToConfirm as Article).id);
                    addToast(`Article deleted.`, 'success');
                    refreshData();
                    break;
            }
        } catch (error: any) {
            addToast(error.message || 'Action failed.', 'error');
        }
        
        setItemToConfirm(null);
        setActionToConfirm(null);
    };

    const handleModerationAction = (flag: FlaggedContent) => {
        setItemToConfirm(flag);
        setActionToConfirm(flag.contentType === 'user' ? 'suspendFlaggedUser' : 'deleteFlaggedContent');
    };

    const handleSaveRole = async (userId: string, newRole: Role) => {
        await updateUserRole(userId, newRole);
        setUserToManage(null);
        setIsRoleModalOpen(false);
        refreshData();
    };
    
    const handleSaveVerification = async (userId: string, newStatus: 'Verified' | 'Rejected', tier: VerificationTier) => {
        const userToUpdate = await getUserById(userId);
        if(userToUpdate) {
            await apiUpdateUserProfile(userId, { verificationStatus: newStatus as VerificationStatus, verificationTier: newStatus === 'Verified' ? tier : VerificationTier.None });
            setUserToVerify(null);
            refreshData();
        }
    };
    
    const handleDismissAlert = async (alertId: string) => {
        await dismissSecurityAlert(alertId);
        refreshData();
    };
    
    const handleWithdrawCommission = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        const amount = parseFloat(commissionWithdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            addToast("Please enter a valid amount.", "error");
            return;
        }

        setIsWithdrawing(true);
        try {
            await withdrawCommission(user.id, amount, 'Admin Bank Account (Simulated)');
            addToast(`Successfully initiated withdrawal of XAF ${amount.toLocaleString()}.`, 'success');
            setCommissionWithdrawAmount('');
            refreshData();
        } catch (error: any) {
            addToast(error.message, 'error');
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handleResolveFlag = async (flagId: string) => {
        await resolveFlaggedContent(flagId);
        addToast("Flag resolved.", "success");
        refreshData();
    };

    const handleSaveArticle = async (articleData: any) => {
        if (!user) return;
        try {
            if (articleToEdit) {
                await updateArticle(articleToEdit.id, articleData);
                addToast("Article updated successfully.", "success");
            } else {
                await createArticle(user, articleData);
                addToast("Article created successfully.", "success");
            }
            setIsArticleEditorOpen(false);
            setArticleToEdit(null);
            refreshData();
        } catch (error: any) {
            addToast(error.message || "Failed to save article.", "error");
        }
    };

    const openArticleEditor = (article: Article | null = null) => {
        setArticleToEdit(article);
        setIsArticleEditorOpen(true);
    };

    const filteredLogs = useMemo(() => {
        return activityLogs.filter(log => {
            if (!log.userName || !log.userEmail) return false;
            const userMatch = log.userName.toLowerCase().includes(logUserFilter.toLowerCase()) || log.userEmail.toLowerCase().includes(logUserFilter.toLowerCase());
            const actionMatch = log.action.toLowerCase().includes(logActionFilter.toLowerCase());
            return userMatch && actionMatch;
        });
    }, [activityLogs, logUserFilter, logActionFilter]);

    const filteredListings = useMemo(() => {
        if (listingFilter === 'All') return listings;
        return listings.filter(l => l.status === listingFilter);
    }, [listings, listingFilter]);

    const filteredUsersForVerification = useMemo(() => {
        const usersToFilter = users.filter(u => u.role === Role.Farmer || u.role === Role.ServiceProvider);
        if (verificationFilter === 'All') return usersToFilter;
        return usersToFilter.filter(u => u.verificationStatus === verificationFilter);
    }, [users, verificationFilter]);
    
    const pendingVerificationsCount = useMemo(() => {
        return users.filter(u => 
            (u.role === Role.Farmer || u.role === Role.ServiceProvider) && 
            u.verificationStatus === 'Pending'
        ).length;
    }, [users]);

    const userRolesDistribution = useMemo(() => {
        const distribution: { [key: string]: number } = {};
        users.forEach(u => {
            if (u.role !== Role.Admin) {
                distribution[u.role] = (distribution[u.role] || 0) + 1;
            }
        });
        return distribution;
    }, [users]);

    const usersByRegionDistribution = useMemo(() => {
        const distribution: { [key: string]: number } = {};
        users.forEach(u => {
            if (u.location) {
                const region = getRegionFromCity(u.location) || 'Unknown';
                distribution[region] = (distribution[region] || 0) + 1;
            }
        });
        return distribution;
    }, [users]);


    const TabButton: React.FC<{ tab: Tab, label: string, count?: number }> = ({ tab, label, count }) => (
      <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors relative ${activeTab === tab ? 'bg-primary text-white' : 'text-slate-dark dark:text-dark-text hover:bg-secondary dark:hover:bg-dark-border'}`}>
        {label}
        {count !== undefined && count > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{count}</span>}
      </button>
    );
    
    const StatCard: React.FC<{ title: string; value: React.ReactNode; icon?: string }> = ({ title, value, icon }) => (
        <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
            <div className="flex items-center">
                {icon && <div className="text-2xl mr-3">{icon}</div>}
                <div>
                    <p className="text-sm text-gray-muted dark:text-dark-muted">{title}</p>
                    <div className="text-2xl font-bold text-slate-dark dark:text-dark-text">{value}</div>
                </div>
            </div>
        </div>
    );
    
    const listingStatusColors: Record<ListingStatus, string> = {
        [ListingStatus.Active]: 'bg-green-100 text-green-800',
        [ListingStatus.Pending]: 'bg-yellow-100 text-yellow-800',
        [ListingStatus.Rejected]: 'bg-red-100 text-red-800',
        [ListingStatus.Sold]: 'bg-gray-100 text-gray-800',
    };
    
    const formatCurrency = (amount: number) => `XAF ${amount.toLocaleString('fr-CM')}`;

    const getOverallOrderStatus = (order: Order): OrderStatus => {
        const statuses = order.sellerOrders.map(so => so.status);
        if (statuses.some(s => s === OrderStatus.Disputed)) return OrderStatus.Disputed;
        if (statuses.every(s => s === OrderStatus.Completed)) return OrderStatus.Completed;
        if (statuses.every(s => s === OrderStatus.Cancelled)) return OrderStatus.Cancelled;
        if (statuses.some(s => s === OrderStatus.Processing)) return OrderStatus.Processing;
        if (statuses.some(s => s === OrderStatus.Shipped)) return OrderStatus.Shipped;
        if (statuses.some(s => s === OrderStatus.Delivered)) return OrderStatus.Delivered;
        return OrderStatus.PendingPayment;
    };

    const orderStatusColors: Record<OrderStatus, string> = {
        [OrderStatus.PendingPayment]: 'bg-gray-100 text-gray-800',
        [OrderStatus.Processing]: 'bg-blue-100 text-blue-800',
        [OrderStatus.Shipped]: 'bg-indigo-100 text-indigo-800',
        [OrderStatus.Delivered]: 'bg-purple-100 text-purple-800',
        [OrderStatus.Completed]: 'bg-green-100 text-green-800',
        [OrderStatus.Cancelled]: 'bg-red-100 text-red-800',
        [OrderStatus.Disputed]: 'bg-red-100 text-red-800',
    };


    const renderContent = () => {
        switch(activeTab) {
            case 'analytics': {
                const dashboardKey = `admin_analytics_${user?.id}`;
                const defaultLayout = ['health_monitor', 'admin_profile', 'key_metrics', 'role_chart', 'regional_chart', 'more_metrics'];
                
                const widgets = {
                    health_monitor: {
                        title: 'AI Platform Health Monitor',
                        component: <PlatformHealthMonitor />
                    },
                    admin_profile: {
                        title: 'Admin Profile',
                        component: (
                            <div className="flex items-center gap-2 h-full">
                                {user?.profileImage ? (
                                    <img src={user.profileImage} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg"
                                        style={{ backgroundColor: getColorForName(user?.name || '') }}
                                    >
                                        {getInitials(user?.name || '')}
                                    </div>
                                )}
                                <div className="space-y-0.5">
                                    <p className="font-bold text-sm text-slate-dark dark:text-white">{user?.name}</p>
                                    <p className="text-xs text-gray-muted dark:text-dark-muted">
                                        Role: <span className="font-medium text-slate-dark dark:text-dark-text">{user?.role}</span>
                                    </p>
                                    <p className="text-xs text-gray-muted dark:text-dark-muted">
                                        Phone: <span className="font-medium text-slate-dark dark:text-dark-text">{user?.phoneNumber || 'N/A'}</span>
                                    </p>
                                    <p className="text-xs text-gray-muted dark:text-dark-muted flex items-center gap-1">
                                        Status: <span className={`px-1.5 py-0.5 inline-flex text-[11px] leading-4 font-semibold rounded-full ${user?.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user?.status}</span>
                                    </p>
                                </div>
                            </div>
                        )
                    },
                    key_metrics: {
                        title: 'Key Metrics',
                        component: (
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard title="Total Users" value={analytics?.totalUsers ?? <Spinner size="sm"/>} icon="👥" />
                                <StatCard title="Total Listings" value={analytics?.totalListings ?? <Spinner size="sm"/>} icon="📦" />
                                <StatCard title="Total Orders" value={analytics?.totalOrders ?? <Spinner size="sm"/>} icon="🛒" />
                                <StatCard title="Total Revenue" value={analytics ? `XAF ${analytics.totalRevenue.toLocaleString()}` : <Spinner size="sm" />} icon="💰" />
                            </div>
                        )
                    },
                    role_chart: {
                        title: 'User Distribution by Role',
                        component: <BarChart data={userRolesDistribution} barColor="#8b5cf6" />
                    },
                    regional_chart: {
                        title: 'User Distribution by Region',
                        component: <BarChart data={usersByRegionDistribution} barColor="#3b82f6" />
                    },
                    more_metrics: {
                        title: 'Additional Metrics',
                        component: (
                            <div className="grid grid-cols-1 gap-4">
                                <StatCard title="Avg. Dispute Resolution" value={analytics ? `${(analytics.avgDisputeResolutionHours || 0).toFixed(1)} hours` : <Spinner size="sm" />} icon="⚖️" />
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
            case 'users': return (
                <div className="overflow-x-auto animate-fade-in">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                        <thead className="bg-gray-50 dark:bg-dark-border"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                        <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
                            {users.filter(u => u.role !== Role.Admin).map(u => {
                                const isSelf = u.id === user?.id;
                                return (
                                <tr key={u.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {u.profileImage ? (
                                                <img className="h-10 w-10 rounded-full object-cover" src={u.profileImage} alt={u.name} />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: getColorForName(u.name) }}>
                                                    {getInitials(u.name)}
                                                </div>
                                            )}
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-slate-dark dark:text-dark-text">{u.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-dark-muted">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-muted">{u.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.status}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => setSelectedUser(u)} className="btn btn-sm btn-secondary">Details</button>
                                        {permissions.canPerformUserActions && (
                                            <>
                                                <button onClick={() => setUserToViewSessions(u)} className="btn btn-sm btn-secondary">Sessions</button>
                                                <button onClick={() => { setUserToManage(u); setIsRoleModalOpen(true); }} className="btn btn-sm btn-secondary" disabled={isSelf} title={isSelf ? "Cannot change your own role." : ""}>Role</button>
                                                <button onClick={() => { setItemToConfirm(u); setActionToConfirm('suspend') }} className="btn btn-sm btn-secondary" disabled={isSelf} title={isSelf ? "Cannot suspend your own account." : ""}>{u.status === 'Active' ? 'Suspend' : 'Activate'}</button>
                                                <button onClick={() => { setItemToConfirm(u); setActionToConfirm('deleteUser') }} className="btn btn-sm btn-danger" disabled={isSelf} title={isSelf ? "Cannot delete your own account." : ""}>Delete</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            );
            case 'listings': return (
                 <div className="overflow-x-auto animate-fade-in">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {([ListingStatus.Pending, ListingStatus.Active, ListingStatus.Rejected, ListingStatus.Sold, 'All'] as const).map(status => (
                            <button key={status} onClick={() => setListingFilter(status)} className={`btn btn-sm ${listingFilter === status ? 'btn-primary' : 'btn-secondary'}`}>
                                {status} ({status === 'All' ? listings.length : listings.filter(l => l.status === status).length})
                            </button>
                        ))}
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                        <thead className="bg-gray-50 dark:bg-dark-border">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
                            {filteredListings.map(l => (
                                 <tr key={l.id}>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-dark dark:text-dark-text">{l.title}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-muted">{l.seller.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${listingStatusColors[l.status] || 'bg-gray-100 text-gray-800'}`}>{l.status}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        {permissions.canPerformListingActions && (
                                            <Link to={`/listing/edit/${l.id}`} className="btn btn-sm btn-secondary">Edit</Link>
                                        )}
                                        {l.status === 'Pending' && permissions.canPerformListingActions && (
                                            <>
                                                <button onClick={() => handleUpdateListingStatus(l.id, ListingStatus.Active)} className="btn btn-sm btn-primary">Approve</button>
                                                <button onClick={() => handleUpdateListingStatus(l.id, ListingStatus.Rejected)} className="btn btn-sm btn-danger">Reject</button>
                                            </>
                                        )}
                                         {permissions.canPerformListingActions && (<button onClick={() => { setItemToConfirm(l); setActionToConfirm('deleteListing') }} className="btn btn-sm btn-danger">Delete</button>)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            );
            case 'orders': return (
                <div className="overflow-x-auto animate-fade-in">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                        <thead className="bg-gray-50 dark:bg-dark-border">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
                            {orders.map(order => {
                                const overallStatus = getOverallOrderStatus(order);
                                return (
                                    <tr key={order.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-dark dark:text-dark-text">#{order.id.slice(-6)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-muted">{order.buyerInfo.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-muted">{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-dark dark:text-dark-text">{formatCurrency(order.totalPrice)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${orderStatusColors[overallStatus]}`}>
                                                {overallStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => setSelectedOrder(order)} className="btn btn-sm btn-secondary">View</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {orders.length === 0 && <p className="text-center p-4 text-gray-500">No orders have been placed on the platform yet.</p>}
                </div>
            );
            case 'verifications':
                const verificationStatusColors: { [key in VerificationStatus]: string } = {
                    [VerificationStatus.Verified]: 'bg-green-100 text-green-800',
                    [VerificationStatus.Pending]: 'bg-yellow-100 text-yellow-800',
                    [VerificationStatus.Rejected]: 'bg-red-100 text-red-800',
                    [VerificationStatus.NotSubmitted]: 'bg-gray-100 text-gray-800',
                };
                return (
                <div className="overflow-x-auto animate-fade-in">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {([VerificationStatus.Pending, VerificationStatus.Verified, VerificationStatus.Rejected, VerificationStatus.NotSubmitted, 'All'] as const).map(status => (
                            <button key={status} onClick={() => setVerificationFilter(status)} className={`btn btn-sm ${verificationFilter === status ? 'btn-primary' : 'btn-secondary'}`}>
                                {status}
                            </button>
                        ))}
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                         <thead className="bg-gray-50 dark:bg-dark-border"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-surface dark:divide-dark-border">
                            {filteredUsersForVerification.map(v => ( <tr key={v.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-dark dark:text-dark-text">{v.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-muted">{v.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${verificationStatusColors[v.verificationStatus]}`}>
                                        {v.verificationStatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => setUserToVerify(v)} className="btn btn-sm btn-primary" disabled={v.verificationStatus !== 'Pending'}>
                                        Review
                                    </button>
                                </td>
                            </tr>))}
                        </tbody>
                    </table>
                    {filteredUsersForVerification.length === 0 && <p className="text-center p-4 text-gray-500">No users match the current filter.</p>}
                </div>
            );
            case 'disputes': return (
                 <div className="overflow-x-auto animate-fade-in">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                         <thead className="bg-gray-50 dark:bg-dark-border"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participants</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-surface dark:divide-dark-border">
                            {disputes.map(d => (
                                <tr key={d.id}>
                                    <td className="px-6 py-4 font-semibold">{d.orderId ? `Order #${d.orderId.slice(-6)}` : `Booking #${d.bookingId?.slice(-6)}`}</td>
                                    <td className="px-6 py-4 text-sm">{d.buyerName} vs {d.seller?.name}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">{d.status}</span></td>
                                    <td className="px-6 py-4 text-right"><Link to={`/disputes/${d.id}`} className="btn btn-sm btn-primary">View</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {disputes.length === 0 && <p className="text-center p-4 text-gray-500">No active disputes.</p>}
                </div>
            );
            case 'finances': return (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <StatCard title="Total Escrow Balance" value={formatCurrency(platformFinances?.escrowBalance || 0)} icon="🛡️" />
                        <StatCard title="Platform Commission Balance" value={formatCurrency(platformFinances?.commissionBalance || 0)} icon="🏦" />
                    </div>
                    <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
                        <h3 className="font-semibold text-slate-dark dark:text-dark-text mb-2">Withdraw Commission</h3>
                        <form onSubmit={handleWithdrawCommission} className="flex gap-2">
                             <input type="number" value={commissionWithdrawAmount} onChange={e => setCommissionWithdrawAmount(e.target.value)} placeholder="Amount to withdraw" className="input flex-grow" required />
                             <button type="submit" className="btn btn-primary" disabled={isWithdrawing}>{isWithdrawing ? <Spinner size="sm" /> : 'Withdraw'}</button>
                        </form>
                    </div>
                    <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
                         <h3 className="font-semibold text-slate-dark dark:text-dark-text mb-2">Payout History</h3>
                         <ul className="space-y-2 text-sm">{platformFinances?.payouts.map(p => (<li key={p.id} className="flex justify-between p-2 bg-secondary dark:bg-dark-border rounded-md"><span>{formatCurrency(p.amount)} to {p.destination}</span><span className="text-gray-muted dark:text-dark-muted">{new Date(p.date).toLocaleDateString()}</span></li>))}</ul>
                    </div>
                </div>
            );
            case 'moderation': return (
                <div className="animate-fade-in">
                    <ModerationQueue 
                        flaggedContent={flaggedContent.filter(f => !f.isResolved)}
                        onResolve={handleResolveFlag}
                        onTakeAction={handleModerationAction}
                    />
                </div>
            );
            case 'content': return (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center"><h2 className="text-xl font-semibold">Educational Articles</h2><button onClick={() => openArticleEditor(null)} className="btn btn-primary">+ New Article</button></div>
                    <div className="bg-white dark:bg-dark-surface rounded-lg shadow-md p-4 space-y-3">{articles.map(a => (<div key={a.id} className="flex justify-between items-center p-2 rounded-md hover:bg-secondary dark:hover:bg-dark-border"><Link to={`/community/hub/${a.id}`} className="font-semibold">{a.title}</Link><div className="space-x-2"><button onClick={() => openArticleEditor(a)} className="btn btn-sm btn-secondary">Edit</button><button onClick={() => {setItemToConfirm(a); setActionToConfirm('deleteArticle')}} className="btn btn-sm btn-danger">Delete</button></div></div>))}</div>
                </div>
            );
            case 'platform': return (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-slate-dark dark:text-white mb-6">Platform Appearance</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="label">Platform Logo</label>
                                <div className="mt-2 flex flex-col sm:flex-row items-center gap-6">
                                    <div className="w-32 h-32 bg-gray-100 dark:bg-dark-border rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                                        {platformSettings.logoUrl ? (
                                            <img src={platformSettings.logoUrl} alt="Preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-gray-400 text-xs text-center p-2">No custom logo uploaded. Default will be used.</span>
                                        )}
                                    </div>
                                    <div className="flex-grow space-y-3">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleLogoUpload}
                                            className="input"
                                        />
                                        <p className="text-xs text-gray-muted">Best results with square or landscape SVGs/PNGs (max 2MB).</p>
                                        {platformSettings.logoUrl && (
                                            <button 
                                                onClick={() => setPlatformSettings({ logoUrl: '' })}
                                                className="btn btn-sm btn-danger"
                                            >
                                                Remove Custom Logo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-6 border-t dark:border-dark-border">
                                <button 
                                    onClick={handleSavePlatformSettings} 
                                    disabled={isSavingSettings}
                                    className="btn btn-primary"
                                >
                                    {isSavingSettings ? <Spinner size="sm" /> : 'Save Platform Settings'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
            case 'map': return (<CameroonMap listings={listings} />);
            case 'logs': return (
                 <div className="space-y-4 animate-fade-in">
                     <div className="flex gap-4"><input type="text" placeholder="Filter by user..." value={logUserFilter} onChange={e=>setLogUserFilter(e.target.value)} className="input" /><input type="text" placeholder="Filter by action..." value={logActionFilter} onChange={e=>setLogActionFilter(e.target.value)} className="input" /></div>
                     <ul className="bg-slate-dark text-cream-light dark:bg-gray-800 dark:text-white font-mono text-xs p-4 rounded-lg h-96 overflow-y-scroll space-y-1">
                        {filteredLogs.map(l => (
                            <li key={l.id}>
                                <span className="text-green-400">{new Date(l.timestamp).toLocaleString()}</span>{' '}
                                <span className="text-yellow-400">{l.userName} ({l.userEmail})</span>: {l.action}{}
                                {l.details && <span className="text-cyan-400">({l.details})</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            );
            case 'security': return (
                <div className="space-y-4 animate-fade-in">
                    {securityAlerts.length > 0 ? securityAlerts.map(alert => (
                        <div key={alert.id} className={`p-4 rounded-lg flex justify-between items-start gap-4 ${alert.isRead ? 'bg-gray-50 dark:bg-dark-surface/50 opacity-70' : 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400'}`}>
                            <div className="flex-shrink-0 text-xl pt-1">
                                {alert.type === 'Failed Login' && '🚫'}
                                {alert.type === 'Flagged Listing' && '🚩'}
                                {alert.type === 'Unusual Activity' && '⚠️'}
                            </div>
                            <div className="flex-grow">
                                <p className={`font-semibold ${alert.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-yellow-800 dark:text-yellow-200'}`}>{alert.type}</p>
                                <p className="text-sm text-slate-dark dark:text-dark-text">{alert.message}</p>
                                <p className="text-xs text-gray-muted dark:text-dark-muted mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                            </div>
                            {!alert.isRead && (
                                <button onClick={() => handleDismissAlert(alert.id)} className="btn btn-sm btn-secondary flex-shrink-0">
                                    Dismiss
                                </button>
                            )}
                        </div>
                    )) : (
                        <p className="text-center text-gray-muted dark:text-dark-muted p-8">No security alerts at this time.</p>
                    )}
                </div>
            );
            default: return null;
        }
    }
    
    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b dark:border-dark-border pb-4">
                <TabButton tab="analytics" label={t('tabAdminAnalytics')} />
                <TabButton tab="platform" label="Platform Settings" />
                {permissions.canManagePlatformFinances && <TabButton tab="finances" label={t('tabAdminFinances')} />}
                {permissions.canManageSecurityAlerts && <TabButton tab="security" label={t('tabAdminSecurity')} count={securityAlerts.filter(a => !a.isRead).length} />}
                {permissions.canManageDisputes && <TabButton tab="moderation" label={t('tabAdminModeration')} count={flaggedContent.filter(f => !f.isResolved).length} />}
                {permissions.canViewAllUsers && <TabButton tab="users" label={t('tabAdminUsers')} />}
                <TabButton tab="listings" label={t('tabAdminListings')} count={listings.filter(l => l.status === 'Pending').length} />
                <TabButton tab="orders" label="All Orders" count={orders.length} />
                {permissions.canManageVerifications && <TabButton tab="verifications" label={t('tabAdminVerifications')} count={pendingVerificationsCount} />}
                {permissions.canManageDisputes && <TabButton tab="disputes" label={t('tabAdminDisputes')} count={disputes.filter(d => d.status === 'Open').length} />}
                {permissions.canPerformListingActions && <TabButton tab="content" label={t('tabAdminContent')} />}
                <TabButton tab="map" label={t('tabAdminMap')} />
                {permissions.canViewActivityLogs && <TabButton tab="logs" label={t('tabAdminLogs')} />}
            </div>
            
            <div className="mt-6">
                {renderContent()}
            </div>
            
            <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} />
            <ConfirmationModal 
                isOpen={!!actionToConfirm}
                onClose={() => {setActionToConfirm(null); setItemToConfirm(null)}}
                onConfirm={handleConfirmAction}
                title={`Confirm Action`}
                message={<span>Are you sure you want to proceed? This action cannot be undone.</span>}
            />
            <RoleManagementModal 
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                user={userToManage}
                onSave={handleSaveRole}
            />
            <VerificationManagementModal 
                isOpen={!!userToVerify}
                onClose={() => setUserToVerify(null)}
                user={userToVerify}
                onSave={handleSaveVerification}
            />
            <UserSessionsModal
                isOpen={!!userToViewSessions}
                onClose={() => setUserToViewSessions(null)}
                user={userToViewSessions}
            />
             <ArticleEditorModal
                isOpen={isArticleEditorOpen}
                onClose={() => { setIsArticleEditorOpen(false); setArticleToEdit(null); }}
                article={articleToEdit}
                onSave={handleSaveArticle}
            />
            <AdminOrderDetailsModal 
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onStatusUpdate={handleUpdateOrderStatus}
            />
        </div>
    )
};

export default AdminDashboard;
