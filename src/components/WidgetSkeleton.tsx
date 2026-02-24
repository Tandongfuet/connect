import React from 'react';

const WidgetSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
    <div className="space-y-3 animate-pulse">
        {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${i === lines -1 ? 'w-2/3' : 'w-full'}`}></div>
        ))}
    </div>
);

export default WidgetSkeleton;