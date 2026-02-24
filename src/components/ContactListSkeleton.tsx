import React from 'react';

const ContactListSkeleton: React.FC = () => (
    <ul className="overflow-y-auto flex-1 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                </div>
            </li>
        ))}
    </ul>
);

export default ContactListSkeleton;