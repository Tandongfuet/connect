import React, { useState, useEffect } from 'react';
import type { Event } from '../../types';
import { mockGetEvents } from '../../services/mockApi';
import Spinner from '../Spinner';
import EmptyState from '../EmptyState';
import EventListSkeleton from '../EventListSkeleton';

const EventsList: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const data = await mockGetEvents();
                setEvents(data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    if (loading) {
        return <EventListSkeleton />;
    }
    
    if (events.length === 0) {
        return <EmptyState icon="🗓️" title="No Upcoming Events" message="Check back later for workshops, markets, and community events." />;
    }

    return (
        <div className="space-y-6">
             <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-slate-dark dark:text-white">🗓️ Upcoming Events & Workshops</h2>
                <p className="text-gray-muted dark:text-dark-muted mt-1 text-sm">Stay informed about local agricultural happenings.</p>
            </div>
            {events.map(event => (
                <div key={event.id} className="bg-white dark:bg-dark-surface p-5 rounded-lg shadow-md flex items-start gap-4">
                    <div className="text-center flex-shrink-0 w-20">
                        <p className="text-sm font-bold text-primary">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                        <p className="text-3xl font-bold text-slate-dark dark:text-white">{new Date(event.date).getDate()}</p>
                        <p className="text-xs text-gray-muted dark:text-dark-muted">{new Date(event.date).getFullYear()}</p>
                    </div>
                    <div className="border-l dark:border-dark-border pl-4 flex-grow">
                        <h3 className="text-lg font-bold text-slate-dark dark:text-white">{event.title}</h3>
                        <p className="text-sm text-gray-muted dark:text-dark-muted">📍 {event.location} • Organized by {event.organizer}</p>
                        <p className="mt-2 text-sm text-slate-dark dark:text-dark-text">{event.description}</p>
                        {event.link && (
                            <a href={event.link} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary mt-3">
                                Learn More & Register
                            </a>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default EventsList;