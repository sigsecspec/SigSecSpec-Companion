self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('sss-cache-v1').then(cache => cache.addAll([
    './',
    './index.html',
    './codes.html',
    './radio.html',
    './incident.html',
    './shift.html',
    './reports.html',
    './tools.html',
    './visitor-log.html',
    './patrol-checklist.html',
    './emergency-contacts.html',
    './shift-timer.html',
    './flashlight.html',
    './settings.html',
    './app.css',
    './app.js',
    './patch-bg.png',
  ])));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request).then(networkResp => {
      const copy = networkResp.clone();
      caches.open('sss-cache-v1').then(cache => cache.put(event.request, copy)).catch(()=>{});
      return networkResp;
    }).catch(()=>resp))
  );
});
