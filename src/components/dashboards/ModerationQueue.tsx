import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { FlaggedContent, AITriagedContent } from '../../types';
// FIX: Correct import path to solve "has no exported member" error.
import { mockTriageFlaggedContent as triageFlaggedContent } from '../../services/mockApi';
import NotificationListSkeleton from '../NotificationListSkeleton';

interface ModerationQueueProps {
    flaggedContent: FlaggedContent[];
    onResolve: (flagId: string) => void;
    onTakeAction: (flag: FlaggedContent) => void;
}

const ModerationQueue: React.FC<ModerationQueueProps> = ({ flaggedContent, onResolve, onTakeAction }) => {
    const [triagedContent, setTriagedContent] = useState<AITriagedContent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const triageAll = async () => {
            setLoading(true);
            const promises = flaggedContent.map(async (flag) => {
                const triageResult = await triageFlaggedContent(flag.id);
                return { ...flag, ...triageResult };
            });

            const results = await Promise.all(promises);
            // Sort by priority: Critical > Medium > Low
            results.sort((a, b) => {
                const priorityOrder = { 'Critical': 3, 'Medium': 2, 'Low': 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            });
            setTriagedContent(results);
            setLoading(false);
        };

        if (flaggedContent.length > 0) {
            triageAll();
        } else {
            setLoading(false);
            setTriagedContent([]);
        }
    }, [flaggedContent]);

    const priorityClasses = {
        Critical: 'bg-red-100 text-red-800 border-red-500 dark:bg-red-900/40 dark:text-red-200',
        Medium: 'bg-yellow-100 text-yellow-800 border-yellow-500 dark:bg-yellow-900/40 dark:text-yellow-200',
        Low: 'bg-green-100 text-green-800 border-green-500 dark:bg-green-900/40 dark:text-green-200',
    };

    if (loading) {
        return <NotificationListSkeleton />;
    }

    if (triagedContent.length === 0) {
        return <p className="text-center text-gray-muted dark:text-dark-muted p-8">The moderation queue is empty. Great job! ✨</p>;
    }

    return (
        <div className="space-y-4">
            {triagedContent.map(item => (
                <div key={item.id} className={`p-4 rounded-lg shadow-md border-l-4 ${priorityClasses[item.priority]}`}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Content & Reason */}
                        <div className="md:col-span-2">
                            <p className="text-xs text-gray-500 dark:text-dark-muted">{item.contentType === 'user' ? 'Reported User' : 'Content Preview'}</p>
                            <blockquote className="italic border-l-2 dark:border-gray-600 pl-2 my-1">"{item.contentPreview}"</blockquote>
                            <p className="text-xs text-gray-500 dark:text-dark-muted mt-2">Reason for Flag</p>
                            <p className="font-semibold">{item.reason}</p>
                            <p className="text-xs text-gray-400 dark:text-dark-muted mt-1">Reported by: {item.reportedBy.name}</p>
                        </div>

                        {/* AI Triage */}
                        <div className="bg-white/50 dark:bg-dark-surface/50 p-3 rounded-md">
                             <p className="text-xs font-bold flex items-center gap-1">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600">✨</span>
                                AI Triage
                            </p>
                            <p className="text-sm mt-1">
                                <span className="font-semibold">Priority: </span>
                                <span className={`font-bold ${priorityClasses[item.priority].split(' ')[1]}`}>{item.priority}</span>
                            </p>
                            <p className="text-sm mt-1">
                                <span className="font-semibold">Suggested Action: </span>{item.suggestedAction}
                            </p>
                        </div>
                        
                        {/* Actions */}
                        <div className="md:col-span-1 flex flex-col justify-center items-end gap-2">
                            <Link to={item.contentType === 'user' ? `/seller/${item.contentId}` : '/community'} className="btn btn-sm btn-secondary w-full">
                                {item.contentType === 'user' ? 'View Profile' : 'View Content'}
                            </Link>
                            <button onClick={() => onTakeAction(item)} className="btn btn-sm btn-danger w-full">
                                {item.contentType === 'user' ? 'Suspend User & Resolve' : 'Delete & Resolve'}
                            </button>
                            <button onClick={() => onResolve(item.id)} className="btn btn-sm btn-light w-full">Dismiss Flag</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ModerationQueue;