
import React, { useState, useEffect, useMemo } from 'react';
import { 
    getAgriculturalTasks, 
    // weather remains mock
    mockGetWeather, 
    getProduceSubscriptions, 
    toggleProduceSubscription, 
    updateTaskProgress, 
    // reminder currently mock
    mockSetTaskReminder, 
    clearTaskProgress, 
    clearAllTaskProgress 
} from '../services/api';
import type { AgriculturalTask, WeatherData, ProduceSubscription } from '../types';
import Spinner from '../components/Spinner';
import { regions } from '../services/locationData';
import { agriculturalTasks } from '../services/taskData';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../hooks/useRole';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import ConfirmationModal from '../components/ConfirmationModal';
import NotificationListSkeleton from '../components/NotificationListSkeleton';

const ALL_CROPS = ['All Crops', ...Array.from(new Set(agriculturalTasks.map(t => t.crop))).sort()];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const WeatherWidget: React.FC<{ region: string }> = ({ region }) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (region !== 'All Regions') {
            setLoading(true);
            mockGetWeather(region).then(data => {
                setWeather(data);
                setLoading(false);
            });
        } else {
            setWeather(null);
        }
    }, [region]);

    if (region === 'All Regions') return null;
    if (loading) return <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center"><Spinner size="sm" /></div>;
    if (!weather) return null;
    
    const weatherIcons: Record<WeatherData['conditions'], string> = {
        Sunny: '☀️', Cloudy: '☁️', Rainy: '🌧️', Stormy: '⛈️'
    };

    return (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400 animate-fade-in">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 text-sm">Forecast for {region}</h3>
            <div className="flex justify-between items-center mt-2 text-sm text-blue-700 dark:text-blue-300">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{weatherIcons[weather.conditions]}</span>
                    <span>{weather.conditions}</span>
                </div>
                <span title="Temperature">🌡️ {weather.temperature}°C</span>
                <span title="Chance of Precipitation">💧 {weather.precipitationChance}%</span>
            </div>
        </div>
    );
};

const SeasonalCalendarPage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { isFarmer, isBuyer } = useRole();
    const { addToast } = useToast();
    const { t } = useLanguage();

    const [tasks, setTasks] = useState<AgriculturalTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCrop, setSelectedCrop] = useState('All Crops');
    const [selectedRegion, setSelectedRegion] = useState('All Regions');
    const [currentMonth] = useState(new Date().getMonth());
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    
    const [subscriptions, setSubscriptions] = useState<ProduceSubscription>({ planting: [], harvest: [] });
    const taskProgress = useMemo(() => user?.taskProgress || {}, [user]);

    const [taskToClear, setTaskToClear] = useState<AgriculturalTask | null>(null);
    const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                const subs = await getProduceSubscriptions(user.id);
                setSubscriptions(subs);
                if (user.location) {
                     setSelectedRegion(regions.find(r => r.includes(user.location || '')) || 'All Regions');
                }
            }
        };
        fetchUserData();
    }, [user]);

    useEffect(() => {
        setLoading(true);
        getAgriculturalTasks({
            crop: selectedCrop,
            region: selectedRegion,
        }).then(data => {
            setTasks(data);
            setLoading(false);
        });
    }, [selectedCrop, selectedRegion]);

    const handlePrint = () => window.print();

    const handleToggleSubscription = async (cropName: string) => {
        if (!user || !isBuyer) return;
        const newSubs = [...subscriptions.harvest];
        if (newSubs.includes(cropName)) {
            setSubscriptions(prev => ({ ...prev, harvest: newSubs.filter(c => c !== cropName) }));
        } else {
            newSubs.push(cropName);
            setSubscriptions(prev => ({ ...prev, harvest: newSubs }));
        }
        await toggleProduceSubscription(user.id, cropName, 'harvest');
        addToast(`Harvest alerts for ${cropName} updated.`, 'success');
    };

    const handleUpdateTaskProgress = async (taskId: string, status: 'Done' | 'Skipped') => {
        if (!user || !isFarmer) return;
        try {
            const updatedUser = await updateTaskProgress(user.id, taskId, status);
            updateUser(updatedUser);
            addToast(`Task marked as ${status.toLowerCase()}.`, 'success');
        } catch (error) {
            addToast("Failed to save progress.", "error");
        }
    };

    const handleConfirmClearTask = async () => {
        if (!user || !taskToClear) return;
        try {
            const updatedUser = await clearTaskProgress(user.id, taskToClear.id);
            updateUser(updatedUser);
            addToast(`Progress for "${taskToClear.task}" cleared.`, 'success');
        } catch (error: any) {
            addToast("Failed to clear progress.", 'error');
        } finally {
            setTaskToClear(null);
        }
    };

    const handleConfirmClearAllTasks = async () => {
        if (!user) return;
        try {
            const updatedUser = await clearAllTaskProgress(user.id);
            updateUser(updatedUser);
            addToast('All task progress cleared.', 'success');
        } catch (error: any) {
            addToast("Failed to clear all progress.", 'error');
        } finally {
            setIsConfirmingClearAll(false);
        }
    };

    const handleSetReminder = async (task: AgriculturalTask) => {
        if (!user || !isFarmer) return;
        await mockSetTaskReminder(user.id, task);
        addToast(`Reminder set for "${task.task}".`, 'success');
    };

    const tasksByMonth = useMemo(() => {
        const grouped: { [key: number]: AgriculturalTask[] } = {};
        for (let i = 1; i <= 12; i++) grouped[i] = [];
        tasks.forEach(task => {
            if (grouped[task.month]) grouped[task.month].push(task);
        }
        );
        return grouped;
    }, [tasks]);
    
    const orderedMonths = useMemo(() => {
        return [...MONTH_NAMES.slice(currentMonth), ...MONTH_NAMES.slice(0, currentMonth)];
    }, [currentMonth]);

    return (
        <div className="animate-fade-in space-y-8">
            <div className="text-center no-print">
                <h1 className="text-4xl font-bold text-slate-dark dark:text-white">{t('calendarTitle')}</h1>
                <p className="text-gray-muted dark:text-gray-400 mt-2 max-w-2xl mx-auto">{t('calendarSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {isSidebarVisible && (
                    <aside className="lg:col-span-1 space-y-6 h-fit lg:sticky top-24 no-print animate-fade-in-left">
                        <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
                             <div className="flex justify-between items-center mb-3 text-slate-dark dark:text-white border-b dark:border-dark-border pb-2">
                                <h2 className="text-lg font-semibold">{t('filtersTitle')}</h2>
                                <button onClick={() => setIsSidebarVisible(false)} className="p-1 text-gray-400 hover:text-primary-dark dark:hover:text-white" title="Collapse Sidebar">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                                </button>
                            </div>
                            <div className="space-y-4 pt-2">
                                <div>
                                    <label htmlFor="crop-filter" className="label text-sm">{t('filterCrop')}</label>
                                    <select id="crop-filter" value={selectedCrop} onChange={e => setSelectedCrop(e.target.value)} className="input">
                                        {ALL_CROPS.map(crop => <option key={crop} value={crop}>{crop}</option>)}
                                    </select>
                                </div>
                                 <div>
                                    <label htmlFor="region-filter" className="label text-sm">{t('filterRegion')}</label>
                                    <select id="region-filter" value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} className="input">
                                        {regions.map(region => <option key={region} value={region}>{region}</option>)}
                                    </select>
                                </div>
                                <button onClick={handlePrint} className="btn btn-secondary w-full">{t('downloadPrint')}</button>
                                {isFarmer && Object.keys(taskProgress).length > 0 && (
                                    <button onClick={() => setIsConfirmingClearAll(true)} className="btn btn-danger w-full">Clear All Progress</button>
                                )}
                            </div>
                        </div>
                        <WeatherWidget region={selectedRegion} />
                    </aside>
                )}

                <main id="printable-calendar" className={`${isSidebarVisible ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-6 relative transition-all duration-300 ease-in-out`}>
                     {!isSidebarVisible && (
                        <div className="fixed top-28 left-4 z-20 no-print">
                            <button onClick={() => setIsSidebarVisible(true)} className="btn btn-secondary rounded-full p-2 shadow-lg" title="Expand Sidebar">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    )}
                    {loading ? (
                        <NotificationListSkeleton />
                    ) : (
                        orderedMonths.map((monthName, index) => {
                            const monthIndex = MONTH_NAMES.indexOf(monthName) + 1;
                            const monthTasks = tasksByMonth[monthIndex];
                            return (
                                <div key={monthName} className="bg-white dark:bg-dark-surface rounded-lg shadow-md animate-fade-in">
                                    <h3 className={`text-xl font-semibold p-3 rounded-t-lg text-center ${index === 0 ? 'bg-primary text-white' : 'bg-primary-dark text-white'}`}>
                                        {monthName}
                                    </h3>
                                    <div className="p-4">
                                        {monthTasks.length > 0 ? (
                                            <ul className="space-y-3">
                                                {monthTasks.map(task => {
                                                    const isExpanded = expandedTaskId === task.id;
                                                    const progress = taskProgress[task.id];
                                                    const isHarvestSubscribed = subscriptions.harvest.includes(task.crop);
                                                    
                                                    const statusColors = {
                                                        'Done': 'bg-green-50 dark:bg-green-900/30 border-green-200',
                                                        'Skipped': 'bg-red-50 dark:bg-red-900/20 border-red-200',
                                                        'Pending': 'bg-secondary dark:bg-dark-border border-transparent'
                                                    };

                                                    return (
                                                        <li key={task.id} className={`p-3 rounded-md transition-all transform border-2 ${statusColors[progress || 'Pending']} hover:shadow-lg hover:-translate-y-0.5`}>
                                                            <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}>
                                                                <span className="text-2xl pt-1">{task.icon}</span>
                                                                <div className="flex-1">
                                                                    <p className={`font-semibold text-slate-dark dark:text-gray-200 ${progress === 'Done' ? 'line-through text-gray-400' : ''}`}>{task.task}</p>
                                                                    <p className="text-xs text-gray-muted dark:text-gray-400">
                                                                        <span className="font-medium text-primary-dark dark:text-primary-light">{task.crop}</span> | <span className="text-gray-500 dark:text-gray-400">{task.region}</span>
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <span className="text-xs font-semibold px-2 py-1 bg-white dark:bg-dark-surface rounded-full flex-shrink-0 shadow-sm">{task.taskType}</span>
                                                                    {progress && <span className={`text-[10px] uppercase font-bold ${progress === 'Done' ? 'text-green-600' : 'text-red-600'}`}>{progress}</span>}
                                                                </div>
                                                            </div>
                                                            {isExpanded && (
                                                                <div className="mt-3 pt-3 border-t dark:border-dark-border/50 space-y-3 animate-fade-in">
                                                                    <div className="text-sm text-slate-dark dark:text-gray-300 space-y-1">
                                                                        {task.details?.timing && <p><strong>Timing:</strong> {task.details.timing}</p>}
                                                                        {task.details?.dosage && <p><strong>Dosage/Rate:</strong> {task.details.dosage}</p>}
                                                                        {task.details?.equipment && <p><strong>Equipment:</strong> {task.details.equipment}</p>}
                                                                    </div>
                                                                    <div className="flex justify-end items-center gap-2 pt-2 no-print">
                                                                        {isFarmer && (
                                                                            <>
                                                                                {progress && (
                                                                                    <button onClick={() => setTaskToClear(task)} className="btn btn-xs btn-ghost text-red-500 hover:bg-red-50">Reset</button>
                                                                                )}
                                                                                <div className="flex-grow"></div>
                                                                                <button onClick={() => handleUpdateTaskProgress(task.id, 'Skipped')} className={`btn btn-xs ${progress === 'Skipped' ? 'btn-danger' : 'btn-ghost'}`}>Skip</button>
                                                                                <button onClick={() => handleUpdateTaskProgress(task.id, 'Done')} className={`btn btn-xs ${progress === 'Done' ? 'btn-primary' : 'btn-ghost'}`}>Done</button>
                                                                                <button onClick={() => handleSetReminder(task)} className="btn btn-xs btn-light">Set Reminder</button>
                                                                            </>
                                                                        )}
                                                                        {isBuyer && task.taskType === 'Harvesting' && (
                                                                             <button onClick={() => handleToggleSubscription(task.crop)} className={`btn btn-xs ${isHarvestSubscribed ? 'btn-primary' : 'btn-ghost'}`} title="Get harvest alerts">
                                                                                🔔 {isHarvestSubscribed ? 'Subscribed' : 'Notify Me'}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : (
                                            <p className="text-center text-gray-muted dark:text-gray-400 py-4 text-sm">No specific tasks found for your selection this month.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </main>
            </div>

            <ConfirmationModal
                isOpen={!!taskToClear}
                onClose={() => setTaskToClear(null)}
                onConfirm={handleConfirmClearTask}
                title="Reset Task Status"
                message={`Return "${taskToClear?.task}" to pending status?`}
                confirmButtonText="Reset"
                confirmButtonClass="btn-danger"
            />
            <ConfirmationModal
                isOpen={isConfirmingClearAll}
                onClose={() => setIsConfirmingClearAll(false)}
                onConfirm={handleConfirmClearAllTasks}
                title="Clear All Progress"
                message="Are you sure you want to clear your status for ALL tasks? This cannot be undone."
                confirmButtonText="Yes, Clear All"
                confirmButtonClass="btn-danger"
            />
        </div>
    );
};

export default SeasonalCalendarPage;
