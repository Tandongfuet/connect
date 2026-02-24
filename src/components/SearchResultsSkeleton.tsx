import React from 'react';

const SearchResultsSkeleton: React.FC = () => (
    <div className="mt-8 animate-pulse">
        {/* Tabs Skeleton */}
        <div className="border-b dark:border-dark-border">
            <div className="flex -mb-px space-x-6">
                <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-t-md w-32"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded-t-md w-32"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded-t-md w-32"></div>
            </div>
        </div>
        {/* Content Skeleton */}
        <div className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="border dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface h-96">
                        <div className="w-full h-48 bg-gray-300 dark:bg-gray-700 rounded-t-lg"></div>
                        <div className="p-4 space-y-3">
                            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mt-4"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);
export default SearchResultsSkeleton;