self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'WalletPass Pro';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.icon || '/icon-192.png',
    data: { url: data.url || 'https://pay.google.com/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || 'https://pay.google.com/';
  event.waitUntil(clients.openWindow(url));
});
