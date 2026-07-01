// Service worker for admin web push notifications (Phase 3b).
// Scope is restricted to /admin/* via the ServiceWorkerRegistration options in AdminShell.

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'New alert', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Coss Cloud Solutions';
  const options = {
    body: data.body || '',
    icon: 'https://res.cloudinary.com/dfditihuw/image/upload/v1782740584/admin-logo-dark.png_vrbcyr.png',
    badge: '/logo.png',
    tag: data.tag || 'coss-admin',
    renotify: true,
    data: { url: data.url || '/admin' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    }),
  );
});
