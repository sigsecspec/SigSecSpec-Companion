const CACHE_NAME = 'security-companion-v1.0.1';
// Use relative paths for compatibility with GitHub Pages or subpath hosting
const urlsToCache = [
  './',
  './index.html',
  './codes.html',
  './radio.html',
  './incident.html',
  './shift.html',
  './reports.html',
  './patrol.html',
  './profile.html',
  './manifest.json',
  './patch-bg.png',
  './app.js',
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

  // Skip external requests except Tailwind CDN
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
            return caches.match('./index.html');
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
  let title = 'Security Companion';
  let body = 'New notification from Security Companion';
  let extraData = {};
  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      body = payload.body || body;
      extraData = payload.data || {};
    } catch (_) {
      try { body = event.data.text(); } catch (_) {}
    }
  }

  const options = {
    body,
    icon: './patch-bg.png',
    badge: './patch-bg.png',
    vibrate: [200, 100, 200],
    data: { ...extraData, dateOfArrival: Date.now() },
    actions: [
      { action: 'explore', title: 'Open App', icon: './patch-bg.png' },
      { action: 'close', title: 'Close', icon: './patch-bg.png' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./index.html')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('./index.html')
    );
  }
});

// Attempt to recover subscription if it changes/invalidates
self.addEventListener('pushsubscriptionchange', async (event) => {
  try {
    const reg = await self.registration;
    const keyRes = await fetch('/api/vapidPublicKey');
    if (!keyRes.ok) return;
    const { publicKey } = await keyRes.json();
    const applicationServerKey = (function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
      return outputArray;
    })(publicKey);

    const newSub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
    await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSub) });
  } catch (e) {
    // best-effort; ignore
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