const CACHE_NAME = 'security-companion-v3.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/codes.html',
  '/radio.html',
  '/incident.html',
  '/shift.html',
  '/reports.html',
  '/patrol.html',
  '/profile.html',
  '/app-styles.css',
  '/manifest.json',
  '/patch-bg.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('cdn.tailwindcss.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response because it's a stream
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(error => {
          console.error('Fetch failed:', error);
          
          // Return a custom offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          
          throw error;
        });
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Sync any pending data when back online
  console.log('Background sync triggered');
  
  // You could implement data synchronization here
  // For example, send any pending incident reports or patrol logs
}

// Push notifications
self.addEventListener('push', event => {
  let notificationData = {
    title: 'Security Companion',
    body: 'New notification from Security Companion',
    icon: 'patch-bg.png',
    badge: 'patch-bg.png'
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [200, 100, 200, 100, 200],
    tag: 'security-notification',
    requireInteraction: true,
    data: {
      dateOfArrival: Date.now(),
      primaryKey: Date.now(),
      url: notificationData.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: 'patch-bg.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: 'patch-bg.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  const action = event.action;

  // Handle persistent mission notification actions
  if (event.notification.tag === 'persistent-mission') {
    const notificationData = event.notification.data || {};
    
    if (action === 'start_patrol') {
      // Store action for app to handle
      self.registration.showNotification('Starting Patrol...', {
        body: 'Opening patrol page',
        tag: 'action-feedback',
        icon: 'patch-bg.png',
        silent: true
      });
      
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
          .then(clientList => {
            // Try to message existing client first
            for (const client of clientList) {
              if (client.url.includes(self.location.origin)) {
                client.postMessage({
                  type: 'NOTIFICATION_ACTION',
                  action: 'start_patrol',
                  data: notificationData
                });
                return client.focus();
              }
            }
            // Open new window if app is not open
            return clients.openWindow('/patrol.html?autostart=true');
          })
      );
      return;
    } else if (action === 'create_incident') {
      // Store action for app to handle
      self.registration.showNotification('Opening Incident Report...', {
        body: 'Creating new incident report',
        tag: 'action-feedback',
        icon: 'patch-bg.png',
        silent: true
      });
      
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
          .then(clientList => {
            // Try to message existing client first
            for (const client of clientList) {
              if (client.url.includes(self.location.origin)) {
                client.postMessage({
                  type: 'NOTIFICATION_ACTION',
                  action: 'create_incident',
                  data: notificationData
                });
                return client.focus();
              }
            }
            // Open new window if app is not open
            return clients.openWindow('/incident.html?fromnoti=true');
          })
      );
      return;
    }
  }

  // Handle other notification actions
  if (action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              client.focus();
              return client.navigate(urlToOpen);
            }
          }
          // Open new window if app is not open
          return clients.openWindow(urlToOpen);
        })
    );
  } else if (action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }
          return clients.openWindow(urlToOpen);
        })
    );
  }
});

// Message handler for communication with main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'content-sync') {
    event.waitUntil(doPeriodicSync());
  }
});

async function doPeriodicSync() {
  // Periodic sync for app updates or data refresh
  console.log('Periodic sync triggered');
}