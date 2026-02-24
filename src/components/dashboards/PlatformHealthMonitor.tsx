import React, { useState, useEffect } from 'react';
import { mockGetPlatformHealth as getPlatformHealth } from '../../services/mockApi';
import Spinner from '../Spinner';
import PlatformHealthSkeleton from '../PlatformHealthSkeleton';

const PlatformHealthMonitor: React.FC = () => {
    const [healthData, setHealthData] = useState<{
        weeklySignups: number;
        weeklyTransactions: number;
        flaggedContent: number;
        aiSummary: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getPlatformHealth();
                setHealthData(data);
            } catch (error) {
                console.error("Failed to fetch platform health data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const Stat: React.FC<{ value: number, label: string, icon: string }> = ({ value, label, icon }) => (
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-border rounded-lg">
            <div className="text-3xl">{icon}</div>
            <div>
                <p className="text-2xl font-bold text-slate-dark dark:text-white">{value}</p>
                <p className="text-sm text-gray-muted dark:text-dark-muted">{label}</p>
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-semibold text-slate-dark dark:text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🩺</span> Platform Health Monitor
            </h3>
            {loading ? (
                <PlatformHealthSkeleton />
            ) : healthData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <Stat value={healthData.weeklySignups} label="New Users (Last 7 Days)" icon="📈" />
                        <Stat value={healthData.weeklyTransactions} label="Transactions (Last 7 Days)" icon="💳" />
                        <Stat value={healthData.flaggedContent} label="Active Moderation Flags" icon="🚩" />
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border-l-4 border-indigo-400">
                        <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600">✨</span>
                            AI Analysis
                        </h4>
                        <p className="mt-2 text-sm text-indigo-700 dark:text-indigo-300 whitespace-pre-wrap">
                            {healthData.aiSummary}
                        </p>
                    </div>
                </div>
            ) : (
                <p className="text-center text-gray-muted">Could not load health data.</p>
            )}
        </div>
    );
};

export default PlatformHealthMonitor;