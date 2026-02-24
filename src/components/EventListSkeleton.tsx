import React from 'react';

const EventListSkeleton: React.FC = () => (
    <div className="space-y-6 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-dark-surface p-5 rounded-lg shadow-md flex items-start gap-4">
                <div className="flex-shrink-0 w-20 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
                </div>
                <div className="border-l dark:border-dark-border pl-4 flex-grow space-y-3">
                    <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full mt-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
                </div>
            </div>
        ))}
    </div>
);

export default EventListSkeleton;