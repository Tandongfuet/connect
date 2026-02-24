import React, { lazy, Suspense, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../constants';
import Spinner from '../components/Spinner';
import { useLanguage } from '../contexts/LanguageContext';
import DashboardSkeleton from '../components/DashboardSkeleton';

// Lazy-load dashboard components for better performance
const AdminDashboard = lazy(() => import('../components/dashboards/AdminDashboard'));
const FarmerDashboard = lazy(() => import('../components/dashboards/FarmerDashboard'));
const BuyerDashboard = lazy(() => import('../components/dashboards/BuyerDashboard'));
const ServiceProviderDashboard = lazy(() => import('../components/dashboards/ServiceProviderDashboard'));
const SupportAgentDashboard = lazy(() => import('../components/dashboards/SupportAgentDashboard'));

const DashboardLoader: React.FC = () => (
    <DashboardSkeleton />
);

const WelcomeModal: React.FC<{ onStartTour: () => void, onSkip: () => void, userName: string }> = ({ onStartTour, onSkip, userName }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in">
        <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-slate-dark dark:text-white">Welcome to AgroConnect, {userName}!</h2>
            <p className="text-gray-muted dark:text-dark-muted my-4">
                We're excited to have you. Would you like a quick tour to see how everything works?
            </p>
            <div className="flex justify-center gap-4 mt-6">
                <button onClick={onSkip} className="btn btn-light">Maybe Later</button>
                <button onClick={onStartTour} className="btn btn-primary">Start Tour</button>
            </div>
        </div>
    </div>
);

const DashboardPage: React.FC = () => {
    const { user, loading } = useAuth();
    const { t } = useLanguage();
    
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [startTour, setStartTour] = useState(false);

    useEffect(() => {
        // Trigger welcome modal only on the very first login
        if (user?.isFirstLogin) {
            setShowWelcomeModal(true);
        }
    }, [user]);

    const handleStartTour = () => {
        setShowWelcomeModal(false);
        setStartTour(true);
    };

    const handleSkipTour = () => {
        setShowWelcomeModal(false);
    };

    if (loading) {
        return <DashboardLoader />;
    }

    if (!user) {
        return <div className="text-center p-8">Please log in to view your dashboard.</div>;
    }
    
    const renderDashboard = () => {
        switch (user.role) {
            case Role.Admin:
                return <AdminDashboard />;
            case Role.Farmer:
                return <FarmerDashboard startTour={startTour} />;
            case Role.Buyer:
                return <BuyerDashboard startTour={startTour} />;
            case Role.ServiceProvider:
                return <ServiceProviderDashboard startTour={startTour} />;
            case Role.SupportAgent:
                return <SupportAgentDashboard />;
            default:
                return <div>Your dashboard is not available.</div>;
        }
    };

    return (
        <div className="animate-fade-in">
            {showWelcomeModal && (
                <WelcomeModal 
                    onStartTour={handleStartTour}
                    onSkip={handleSkipTour}
                    userName={user.name}
                />
            )}
            <h1 className="text-3xl font-bold text-slate-dark dark:text-dark-text mb-2">{t('welcome')}, {user.name}!</h1>
            <p className="text-gray-muted dark:text-dark-muted mb-8">{t('dashboardGreeting')}</p>
            <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-md">
                <Suspense fallback={<DashboardLoader />}>
                    {renderDashboard()}
                </Suspense>
            </div>
        </div>
    );
};

export default DashboardPage;