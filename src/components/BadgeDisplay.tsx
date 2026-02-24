import React, { useState, useEffect } from 'react';
import { mockGetBadges } from '../services/mockApi';
import type { Badge } from '../types';
import Spinner from './Spinner';

interface BadgeDisplayProps {
    badgeIds: string[];
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badgeIds }) => {
    const [allBadges, setAllBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        mockGetBadges().then(data => {
            setAllBadges(data);
            setLoading(false);
        });
    }, []);

    if (loading) return <Spinner />;
    
    const userBadges = allBadges.filter(b => badgeIds.includes(b.id));

    if (userBadges.length === 0) {
        return <p className="text-sm text-gray-muted dark:text-dark-muted">No badges earned yet.</p>;
    }

    return (
        <div className="bg-secondary dark:bg-dark-border p-4 rounded-lg flex flex-wrap gap-4">
            {userBadges.map(badge => (
                <div key={badge.id} className="relative group" title={badge.description}>
                    <div className="flex flex-col items-center text-center w-20">
                        <span className="text-4xl">{badge.icon}</span>
                        <p className="text-xs font-semibold mt-1 text-slate-dark dark:text-dark-text truncate">{badge.name}</p>
                    </div>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-gray-800 text-white text-xs text-center rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {badge.description}
                        <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BadgeDisplay;