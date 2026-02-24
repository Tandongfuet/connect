
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockGetFeedForUser } from '../../services/mockApi';
import type { User, Listing, ForumPost } from '../../types';
import Spinner from '../Spinner';
import EmptyState from '../EmptyState';
import ActivityCard from './ActivityCard';

export type Activity = 
    | { type: 'new_listing'; user: User; content: Listing; timestamp: string; }
    | { type: 'new_post'; user: User; content: ForumPost; timestamp: string; };

const FeedTab: React.FC = () => {
    const { user } = useAuth();
    const [feed, setFeed] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setLoading(true);
            mockGetFeedForUser(user.id)
                .then(setFeed)
                .catch(err => console.error("Failed to fetch feed:", err))
                .finally(() => setLoading(false));
        }
    }, [user]);

    if (loading) {
        return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;
    }

    if (feed.length === 0) {
        return (
            <EmptyState
                icon="👀"
                title="Your Feed is Quiet"
                message="Follow farmers and service providers to see their latest products and posts here."
                actionText="Explore Marketplace"
                actionTo="/products"
            />
        );
    }

    return (
        <div className="space-y-6">
            {feed.map((activity, index) => (
                <ActivityCard key={`${activity.type}-${activity.content.id}-${index}`} activity={activity} />
            ))}
        </div>
    );
};

export default FeedTab;
