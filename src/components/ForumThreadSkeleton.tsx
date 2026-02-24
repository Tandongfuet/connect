import React from 'react';

const ForumThreadSkeleton: React.FC = () => (
    <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b dark:border-dark-border space-y-4">
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="flex items-center gap-3 mt-4">
                    <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                </div>
                <div className="space-y-3 mt-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
            </div>
            <div className="p-6 space-y-6">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                {/* Reply Skeleton */}
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 mt-1 flex-shrink-0"></div>
                    <div className="flex-1 bg-gray-200 dark:bg-dark-border p-3 rounded-lg h-20"></div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 mt-1 flex-shrink-0"></div>
                    <div className="flex-1 bg-gray-200 dark:bg-dark-border p-3 rounded-lg h-16"></div>
                </div>
            </div>
        </div>
    </div>
);

export default ForumThreadSkeleton;