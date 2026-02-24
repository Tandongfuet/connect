import React from 'react';

const SellerProfileSkeleton: React.FC = () => (
    <div className="animate-pulse">
        {/* Seller Header Skeleton */}
        <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-md mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-full bg-gray-300 dark:bg-gray-700"></div>
            <div className="flex-grow space-y-3 w-full sm:w-auto">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
            </div>
          </div>
        </div>

        {/* Listings Skeleton */}
        <div>
          <div className="h-7 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

export default SellerProfileSkeleton;