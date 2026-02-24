// Service Worker disabled for local development stability.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => {});
self.addEventListener('fetch', () => {});