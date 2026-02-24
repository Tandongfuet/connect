import React from 'react';

const CommunityPageSkeleton: React.FC = () => (
    <div className="animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-6">
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mt-2"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="border-b dark:border-dark-border mb-6">
            <div className="flex space-x-6">
                <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
            </div>
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Sidebar Skeleton */}
            <aside className="md:col-span-1 h-fit">
                <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md h-64">
                    <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            </aside>
            {/* Content Skeleton */}
            <main className="md:col-span-3 space-y-4">
                <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md h-48"></div>
                <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md h-32"></div>
                <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md h-32"></div>
            </main>
        </div>
    </div>
);

export default CommunityPageSkeleton;