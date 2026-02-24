
import React from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import Spinner from '../components/Spinner';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import NotificationListSkeleton from '../components/NotificationListSkeleton';

const NotificationsPage: React.FC = () => {
  const { notifications, loading, markAllAsRead, unreadCount, markAsRead } = useNotification();

  const getNotificationIcon = (type: string, isAI?: boolean) => {
    if (isAI) return '🤖';
    switch (type) {
        case 'New Inquiry': return '💬';
        case 'New Booking': return '📅';
        case 'Listing Approved': return '✅';
        case 'Security Alert': return '⚠️';
        default: return '🔔';
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <BreadcrumbNavigation paths={[{ name: 'Dashboard', path: '/dashboard' }, { name: 'Notifications' }]} />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-dark dark:text-white">Notifications</h1>
        {unreadCount > 0 && (
            <button 
                onClick={markAllAsRead}
                className="btn btn-primary"
            >
                Mark All as Read
            </button>
        )}
      </div>

      {loading ? (
        <NotificationListSkeleton />
      ) : notifications.length === 0 ? (
        <div className="text-center bg-white dark:bg-dark-surface p-10 rounded-lg shadow-md">
          <p className="text-gray-muted dark:text-dark-muted">You have no notifications.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-md overflow-hidden">
            <ul className="divide-y divide-gray-200 dark:divide-dark-border">
                {notifications.map(notification => (
                    <li key={notification.id} className={`${!notification.isRead ? 'bg-primary-light/30 dark:bg-primary/20' : 'bg-white dark:bg-dark-surface'} hover:bg-secondary dark:hover:bg-dark-border transition-colors`}>
                        <Link to={notification.link} onClick={() => markAsRead(notification.id)} className="block p-4">
                            <div className="flex items-start space-x-4">
                                <div className="text-2xl">{getNotificationIcon(notification.type, notification.isAI)}</div>
                                <div className="flex-1">
                                    <p className={`text-sm ${!notification.isRead ? 'font-semibold text-slate-dark dark:text-white' : 'text-slate-dark dark:text-dark-text'}`}>
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-muted dark:text-dark-muted mt-1">
                                        {new Date(notification.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                {!notification.isRead && (
                                    <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-1" aria-label="Unread"></div>
                                )}
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
