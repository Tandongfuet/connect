/**
 * Requests permission from the user to show push notifications.
 * @returns A promise that resolves to true if permission is granted, false otherwise.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notification');
        return false;
    }

    // Check if permission is already granted
    if (Notification.permission === 'granted') {
        return true;
    }

    // Request permission if not denied
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

/**
 * Displays a push notification to the user if permission has been granted.
 * @param title - The title of the notification.
 * @param options - The Notification API options (body, icon, etc.).
 */
export const showPushNotification = (title: string, options: NotificationOptions) => {
    // Check if the user has granted permission
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, options);
        
        // Optional: handle notification click
        notification.onclick = () => {
            window.focus(); // Focus the window when notification is clicked
        };
    }
};
