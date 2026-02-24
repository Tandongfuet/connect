import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import type { Notification } from '../types';
import { useAuth } from './AuthContext';
import { mockGetNotifications as getNotifications, mockMarkAllAsRead as apiMarkAllAsRead, mockMarkAsRead as apiMarkAsRead } from '../services/mockApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { requestNotificationPermission, showPushNotification } from '../services/notificationService';
import { useToast } from './ToastContext';
import { useNavigate } from 'react-router-dom';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasNewMessageIndicator: boolean;
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  clearNewMessageIndicator: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasNewMessageIndicator, setHasNewMessageIndicator] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Request permission on login
  useEffect(() => {
    if (user) {
        requestNotificationPermission();
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const userNotifications = await getNotifications(user.id);
      setNotifications(userNotifications);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    try {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
        await apiMarkAsRead(user.id, notificationId);
    } catch (err) {
        console.error("Failed to mark notification as read", err);
        fetchNotifications(); // Revert on failure
    }
  }, [user, fetchNotifications]);
  
  // Real-time notification handling
  const notificationTopic = useMemo(() => user ? `notifications_${user.id}` : null, [user]);

  const handleNewNotification = useCallback((newNotification: Notification) => {
      // Avoid adding duplicates if the message arrives multiple times
      if (!notifications.some(n => n.id === newNotification.id)) {
          setNotifications(prev => [newNotification, ...prev]);
          if (newNotification.type === 'New Inquiry') {
              setHasNewMessageIndicator(true);
          }
          
          // Show browser push notification
          const titleMap: { [key in Notification['type']]: string } = {
            'New Inquiry': 'New Chat Message',
            'New Booking': 'New Booking Request',
            'Listing Approved': 'Listing Status Update',
            'Security Alert': 'Security Alert',
            'General': 'AgroConnect Update'
          };
          const title = titleMap[newNotification.type] || 'New Notification';
          
          showPushNotification(title, {
              body: newNotification.message,
              icon: '/brand-icon.png'
          });

          // Show subtle in-app toast notification
          addToast(newNotification.message, 'info', [{
            label: 'View',
            onClick: () => {
              navigate(newNotification.link);
              markAsRead(newNotification.id);
            },
          }]);
      }
  }, [notifications, addToast, navigate, markAsRead]);

  useWebSocket(notificationTopic, handleNewNotification);
  
  const clearNewMessageIndicator = useCallback(() => {
      setHasNewMessageIndicator(false);
  }, []);
  
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      const updatedNotifications = await apiMarkAllAsRead(user.id);
      setNotifications(updatedNotifications);
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    hasNewMessageIndicator,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
    clearNewMessageIndicator,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};