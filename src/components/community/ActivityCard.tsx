
import React from 'react';
import { Link } from 'react-router-dom';
import type { Activity } from './FeedTab';
import { ListingStatus } from '../../constants';

const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b'];
const getColorForName = (name: string) => {
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
};

const UserHeader: React.FC<{ user: Activity['user'], timestamp: string, actionText: string }> = ({ user, timestamp, actionText }) => (
    <div className="flex items-center gap-3">
        {user.profileImage ? (
            <img src={user.profileImage} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
            <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base"
                style={{ backgroundColor: getColorForName(user.name) }}
            >
                {getInitials(user.name)}
            </div>
        )}
        <div>
            <p>
                <Link to={`/seller/${user.id}`} className="font-semibold text-slate-dark dark:text-white hover:underline">{user.name}</Link>
                <span className="text-gray-muted dark:text-dark-muted"> {actionText}</span>
            </p>
            <p className="text-xs text-gray-muted dark:text-dark-muted">{new Date(timestamp).toLocaleString()}</p>
        </div>
    </div>
);

const ActivityCard: React.FC<{ activity: Activity }> = ({ activity }) => {
    const renderContent = () => {
        switch(activity.type) {
            case 'new_listing':
                const listing = activity.content;
                if (listing.status !== ListingStatus.Active) return null; // Don't show pending listings
                return (
                    <>
                        <UserHeader user={activity.user} timestamp={activity.timestamp} actionText="posted a new listing:" />
                        <Link to={`/products/${listing.id}`} className="block mt-3 p-3 bg-secondary dark:bg-dark-border rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <div className="flex gap-4">
                                <img src={listing.images[0]?.url} alt={listing.title} className="w-24 h-24 rounded-md object-cover" />
                                <div>
                                    <h4 className="font-bold text-slate-dark dark:text-white">{listing.title}</h4>
                                    <p className="text-sm text-gray-muted dark:text-dark-muted mt-1">{listing.description.substring(0, 100)}...</p>
                                    <p className="font-bold text-primary mt-2">XAF {listing.price.toLocaleString('fr-CM')}</p>
                                </div>
                            </div>
                        </Link>
                    </>
                );
            case 'new_post':
                const post = activity.content;
                return (
                    <>
                        <UserHeader user={activity.user} timestamp={activity.timestamp} actionText="started a new discussion:" />
                        <Link to={`/community/forum/${post.id}`} className="block mt-3 p-4 bg-secondary dark:bg-dark-border rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <h4 className="font-bold text-slate-dark dark:text-white">{post.title}</h4>
                            <p className="text-sm text-gray-muted dark:text-dark-muted mt-1">{post.content.substring(0, 150)}...</p>
                            <div className="text-xs text-primary font-semibold mt-2">{post.replies.length} replies • {post.likes.length} likes</div>
                        </Link>
                    </>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md animate-fade-in">
            {renderContent()}
        </div>
    );
};

export default ActivityCard;
