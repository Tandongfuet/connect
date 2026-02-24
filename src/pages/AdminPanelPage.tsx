
import React, { useState, useEffect } from 'react';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import BrandIcon from '../components/BrandIcon';
import { useAuth } from '../contexts/AuthContext';
import { getPendingVerifications, getAllDisputes, getListings } from '../services/api';
import { DisputeStatus, ListingStatus } from '../constants';
import Spinner from '../components/Spinner';

// FIX: Define Tab type to match the one in AdminDashboard and added 'platform' option.
type Tab = 'analytics' | 'users' | 'listings' | 'verifications' | 'disputes' | 'orders' | 'transactions' | 'logs' | 'security' | 'map' | 'finances' | 'content' | 'moderation' | 'platform';


interface StatCardProps {
    count: number;
    label: string;
    icon: string;
    tab: Tab;
    color: string;
    onEnterPanel: (tab: Tab) => void;
}

const StatCard: React.FC<StatCardProps> = ({ count, label, icon, tab, color, onEnterPanel }) => (
    <button 
        onClick={() => onEnterPanel(tab)}
        className={`p-6 rounded-lg shadow-md text-left transition-transform transform hover:-translate-y-1 ${color}`}
    >
        <div className="flex items-center justify-between">
            <span className="text-4xl font-bold">{count}</span>
            <span className="text-3xl">{icon}</span>
        </div>
        <p className="mt-2 font-semibold">{label}</p>
    </button>
);

const AdminLandingPage: React.FC<{
    stats: {
        verifications: number;
        disputes: number;
        listings: number;
    };
    onEnterPanel: (tab?: Tab) => void;
    adminName: string;
}> = ({ stats, onEnterPanel, adminName }) => {
    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-dark dark:text-white">Welcome, {adminName}!</h1>
                <p className="text-gray-muted dark:text-dark-muted mt-1">Here's a summary of what needs your attention.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    count={stats.verifications} 
                    label="Pending Verifications" 
                    icon="🛡️" 
                    tab="verifications"
                    color="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200"
                    onEnterPanel={onEnterPanel}
                />
                <StatCard 
                    count={stats.disputes} 
                    label="Open Disputes" 
                    icon="⚖️" 
                    tab="disputes"
                    color="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                    onEnterPanel={onEnterPanel}
                />
                <StatCard 
                    count={stats.listings} 
                    label="Pending Listings" 
                    icon="📦" 
                    tab="listings"
                    color="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                    onEnterPanel={onEnterPanel}
                />
            </div>
            <div className="text-center pt-6">
                <button 
                    onClick={() => onEnterPanel()} 
                    className="btn btn-primary py-3 px-8 text-lg"
                >
                    Enter Full Management Panel
                </button>
            </div>
        </div>
    );
};


const AdminPanelPage: React.FC = () => {
  const { user } = useAuth();
  const [showPanel, setShowPanel] = useState(false);
  // FIX: Type the state to avoid 'string' is not assignable to 'Tab' error.
  const [defaultTab, setDefaultTab] = useState<Tab>('analytics');
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
      verifications: 0,
      disputes: 0,
      listings: 0,
  });

  useEffect(() => {
      const fetchStats = async () => {
          try {
              const [verificationsData, disputesData, listingsData] = await Promise.all([
                  getPendingVerifications(),
                  getAllDisputes(),
                  getListings()
              ]);
              setStats({
                  verifications: verificationsData.length,
                  disputes: disputesData.filter(d => d.status === DisputeStatus.Open).length,
                  listings: listingsData.filter(l => l.status === ListingStatus.Pending).length,
              });
          } catch (error) {
              console.error("Failed to fetch admin stats", error);
          } finally {
              setLoadingStats(false);
          }
      };
      fetchStats();
  }, []);

  const handleEnterPanel = (tab: Tab = 'analytics') => {
      setDefaultTab(tab);
      setShowPanel(true);
  };
  
  if (showPanel) {
      return (
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <BrandIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-slate-dark dark:text-white">Admin Panel</h1>
          </div>
          <p className="text-gray-muted dark:text-dark-muted mb-8">Manage users, approve listings, and oversee platform activity.</p>
          <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-md">
            <AdminDashboard defaultTab={defaultTab} />
          </div>
        </div>
      );
  }

  return (
    <div>
        <div className="flex items-center gap-3 mb-4">
            <BrandIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-slate-dark dark:text-white">Admin Dashboard</h1>
        </div>
        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-md min-h-[400px]">
            {loadingStats ? (
                <div className="flex justify-center items-center h-full min-h-[300px]"><Spinner size="lg" /></div>
            ) : (
                <AdminLandingPage 
                    stats={stats}
                    onEnterPanel={handleEnterPanel}
                    adminName={user?.name || 'Admin'}
                />
            )}
        </div>
    </div>
  );
};

export default AdminPanelPage;
