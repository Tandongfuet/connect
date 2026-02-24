import React from 'react';

const GeneralPageSkeleton: React.FC = () => (
    <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    </div>
);

export default GeneralPageSkeleton;