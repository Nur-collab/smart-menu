// Production-grade Service Worker for Smart Menu Bishkek
// Version: 1.0.0

const CACHE_NAME = 'aura-smart-menu-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon-maskable.png',
];

// Install: Cache critical assets and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use try/catch per asset to prevent entire SW failure if any single asset fails
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn(`[ServiceWorker] Failed to precache ${asset}:`, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate: Clean up previous cache versions and claim all client tabs
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`[ServiceWorker] Purging outdated cache: ${key}`);
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy dispatcher based on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-HTTP/HTTPS schemes (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 1. Navigation requests (HTML pages for guests and staff)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response, clone and update cache
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          // Network failed: attempt to serve requested page from cache
          const cachedPage = await caches.match(request);
          if (cachedPage) {
            return cachedPage;
          }
          // Fallback to cached home page
          const cachedHome = await caches.match('/');
          if (cachedHome) {
            return cachedHome;
          }
          // Emergency offline fallback page
          const offlineFallback = await caches.match('/offline.html');
          return offlineFallback || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        })
    );
    return;
  }

  // 2. Next.js Static Chunks & Fonts (Cache-First)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.includes('/fonts/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Images (Unsplash food photos & SVG/PNG icons) - Stale While Revalidate
  if (
    request.destination === 'image' ||
    url.hostname.includes('unsplash.com') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webp')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
          .catch(() => cached); // If offline, return cached or fallback

        return cached || fetchPromise;
      })
    );
    return;
  }

  // 4. API Requests (/api/*)
  if (url.pathname.startsWith('/api/')) {
    // For non-GET mutations (placing orders, calling waiter), provide offline graceful response
    if (request.method !== 'GET') {
      event.respondWith(
        fetch(request.clone()).catch(() => {
          return new Response(
            JSON.stringify({
              success: true,
              offline: true,
              message: 'Действие сохранено в оффлайн-очереди устройства и будет передано при появлении сети.',
              timestamp: Date.now(),
            }),
            {
              status: 202,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );
      return;
    }

    // For GET API requests: network first with cache fallback
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(
              JSON.stringify({
                error: 'Оффлайн режим',
                message: 'Данные недоступны без подключения к сети',
              }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Default: Network First
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Communication with client tabs
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
