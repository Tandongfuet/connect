import React from 'react';

const NotificationListSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-dark-surface rounded-lg shadow-md overflow-hidden animate-pulse">
        <ul className="divide-y divide-gray-200 dark:divide-dark-border">
            {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="p-4">
                    <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    </div>
);

export default NotificationListSkeleton;