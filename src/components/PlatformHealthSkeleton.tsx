import React from 'react';

const PlatformHealthSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        <div className="space-y-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
        <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg h-full"></div>
    </div>
);

export default PlatformHealthSkeleton;