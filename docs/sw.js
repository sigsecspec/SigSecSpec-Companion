const CACHE_NAME = 'security-companion-v1.0.0';
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
  '/manifest.json',
  'https://cdn.tailwindcss.com'
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

// Push notifications - Enhanced Professional Handler
self.addEventListener('push', event => {
  let notificationData = {};
  
  try {
    notificationData = event.data ? event.data.json() : {};
  } catch (e) {
    notificationData = {
      title: '🛡️ Security Companion',
      body: event.data ? event.data.text() : 'New security alert'
    };
  }

  const options = {
    body: notificationData.body || 'New notification from Security Companion',
    icon: notificationData.icon || '/patch-bg.png',
    badge: notificationData.badge || '/patch-bg.png',
    image: notificationData.image,
    vibrate: notificationData.vibrate || [200, 100, 200],
    tag: notificationData.tag || 'security-alert',
    requireInteraction: notificationData.requireInteraction || false,
    renotify: notificationData.renotify || false,
    silent: notificationData.silent || false,
    timestamp: notificationData.timestamp || Date.now(),
    data: {
      ...notificationData.data,
      dateOfArrival: Date.now(),
      url: notificationData.url || '/'
    },
    actions: notificationData.actions || [
      {
        action: 'view',
        title: '👁️ View',
        icon: '/patch-bg.png'
      },
      {
        action: 'dismiss',
        title: '✕ Dismiss',
        icon: '/patch-bg.png'
      }
    ]
  };

  // Special handling for emergency notifications
  if (notificationData.type === 'emergency') {
    options.requireInteraction = true;
    options.vibrate = [500, 200, 500, 200, 500];
    options.actions = [
      {
        action: 'respond',
        title: '🚨 Respond',
        icon: '/patch-bg.png'
      },
      {
        action: 'location',
        title: '📍 View Location',
        icon: '/patch-bg.png'
      }
    ];
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || '🛡️ Security Companion',
      options
    )
  );
});

// Notification click handler - Enhanced Professional
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  let targetUrl = data.url || '/';

  // Handle different action types
  switch (action) {
    case 'view':
      targetUrl = data.url || '/';
      break;
    case 'respond':
      targetUrl = `/emergency.html?id=${data.id || ''}`;
      break;
    case 'location':
      if (data.location) {
        targetUrl = `/patrol.html?lat=${data.location.lat}&lng=${data.location.lng}`;
      }
      break;
    case 'dismiss':
      // Just close, no action needed
      return;
    default:
      // Default to opening the main URL
      targetUrl = data.url || '/';
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windowClients => {
      // Check if app is already open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate existing client to target URL
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      
      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
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