import React, { useState, useEffect } from 'react';
import { mockGetSellerAnalytics, mockGetServiceAnalytics } from '../services/mockApi';
import { Role } from '../constants';
import Spinner from './Spinner';

interface AIForecastProps {
    sellerId: string;
    role: Role.Farmer | Role.ServiceProvider;
}

const AIForecast: React.FC<AIForecastProps> = ({ sellerId, role }) => {
    const [forecast, setForecast] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchForecast = async () => {
            setLoading(true);
            setError(null);
            try {
                if (role === Role.Farmer) {
                    const data = await mockGetSellerAnalytics(sellerId);
                    if (data?.topProducts?.length > 0) {
                        setForecast(`Based on current market trends and your sales history, demand for **${data.topProducts[0].title}** is expected to increase by 15% next month. Consider increasing your stock. We also predict a higher demand for **organic fertilizers** in your region.`);
                    } else {
                         setForecast("Not enough data to generate a sales forecast.");
                    }
                } else {
                    const data = await mockGetServiceAnalytics(sellerId);
                    if (data?.topServices?.length > 0) {
                        setForecast(`Based on seasonal planting data, there will be a high demand for **${data.topServices[0].title}** services in the next 4-6 weeks in the Centre region. Your **${data.topServices[1]?.title || 'other'}** service is also likely to see more bookings as farmers prepare for the next season.`);
                    } else {
                        setForecast("Not enough data to generate a service forecast.");
                    }
                }
            } catch (error: any) {
                console.error("Failed to fetch AI forecast:", error);
                setError("Could not generate AI forecast at this time.");
                setForecast(""); // Clear any previous forecast
            } finally {
                setLoading(false);
            }
        };
        fetchForecast();
    }, [sellerId, role]);

    const formatAdvice = (text: string) => {
        return text.split('**').map((part, index) => 
            index % 2 === 1 ? <strong key={index}>{part}</strong> : part
        );
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <h3 className="font-semibold text-indigo-800 dark:text-indigo-200 flex items-center gap-2 text-lg">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600">🔮</span>
                AI-Powered Forecast
            </h3>
            <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
                {loading ? (
                    <div className="flex items-center justify-center h-24">
                        <Spinner />
                    </div>
                ) : error ? (
                     <div className="text-red-600 dark:text-red-400">{error}</div>
                ) : (
                    <div className="whitespace-pre-wrap text-slate-dark dark:text-dark-text">{formatAdvice(forecast)}</div>
                )}
            </div>
        </div>
    );
};

export default AIForecast;