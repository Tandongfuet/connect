import React, { useState, useEffect } from 'react';
import { apiGetGrowthAdvice as getGrowthAdvice } from '../../services/api';
import Spinner from '../Spinner';
import { Role } from '../../constants';

interface GrowthAdvisorProps {
    sellerId: string;
    role: Role.Farmer | Role.ServiceProvider;
}

const GrowthAdvisor: React.FC<GrowthAdvisorProps> = ({ sellerId, role }) => {
    const [advice, setAdvice] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAdvice = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getGrowthAdvice();
                setAdvice(data);
            } catch (error: any) {
                console.error("Failed to fetch AI growth advice:", error);
                setError("Could not generate advice at this time.");
            } finally {
                setLoading(false);
            }
        };
        fetchAdvice();
    }, [sellerId, role]);

    const formatAdvice = (text: string) => {
        // Simple markdown for bold text
        return text.split('**').map((part, index) => 
            index % 2 === 1 ? <strong key={index}>{part}</strong> : part
        );
    };

    return (
        <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800 h-full flex flex-col">
            <h3 className="font-semibold text-green-800 dark:text-green-200 flex items-center gap-2 text-lg">
                <span className="text-2xl">💡</span>
                AI Growth Advisor
            </h3>
            <div className="mt-4 flex-grow">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Spinner />
                    </div>
                ) : error ? (
                    <div className="text-red-600 dark:text-red-400">{error}</div>
                ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-slate-dark dark:text-dark-text">
                        {formatAdvice(advice)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GrowthAdvisor;