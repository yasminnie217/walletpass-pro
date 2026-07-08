self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'WalletPass Pro';
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.svg',
    badge: data.icon || '/favicon.svg',
    data: { url: data.url || 'https://pay.google.com/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || 'https://pay.google.com/';
  event.waitUntil(clients.openWindow(url));
});
