import React from 'react';

const DashboardSkeleton: React.FC = () => (
  <div className="animate-pulse">
    {/* Header Skeleton */}
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-8"></div>
    
    {/* Tabs Skeleton */}
    <div className="flex flex-wrap gap-2 border-b dark:border-dark-border pb-4 mb-8">
      <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
    </div>

    {/* Content Skeleton */}
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    </div>
  </div>
);

export default DashboardSkeleton;