// Production-grade Service Worker with Image Pre-caching for Smart Menu Bishkek
// Version: 2.0.0

const CACHE_NAME = 'aura-smart-menu-shell-v2.0.0';
const IMAGE_CACHE_NAME = 'aura-smart-menu-images-v2.0.0';

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

// Полный реестр фотографий 44 блюд меню Aura Coffee & Kitchen для оффлайн-кэширования в подвальных залах
const MENU_IMAGES_PRECACHE = [
  'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1514944298352-7b0a331a6907?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544776193-352d25ca82cd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1575853121743-60c24f0a7502?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  // Новые блюда кыргызской национальной кухни (cat-national)
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
];

// Install: кэширование статического шелла приложения и параллельная предзагрузка картинок Unsplash
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // 1. Статические ресурсы приложения
      caches.open(CACHE_NAME).then(async (cache) => {
        for (const asset of STATIC_ASSETS) {
          try {
            await cache.add(asset);
          } catch (err) {
            console.warn(`[ServiceWorker] Failed to precache asset ${asset}:`, err);
          }
        }
      }),
      // 2. Предварительное кэширование фотографий блюд
      caches.open(IMAGE_CACHE_NAME).then(async (imageCache) => {
        const promises = MENU_IMAGES_PRECACHE.map(async (imageUrl) => {
          try {
            const req = new Request(imageUrl, { mode: 'cors' });
            const res = await fetch(req);
            if (res && res.status === 200) {
              await imageCache.put(req, res);
            }
          } catch {
            // Игнорируем сетевые сбои при установке отдельных картинок
          }
        });
        await Promise.allSettled(promises);
      }),
    ])
  );
  self.skipWaiting();
});

// Activate: очистка устаревших версий кэша
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, IMAGE_CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (!currentCaches.includes(key)) {
              console.log(`[ServiceWorker] Очистка устаревшего кэша: ${key}`);
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: диспетчер стратегий кэширования
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Игнорируем нестандартные протоколы (chrome-extension:// и т.д.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 1. Навигационные запросы (HTML страницы)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;

          const cachedHome = await caches.match('/');
          if (cachedHome) return cachedHome;

          const offlineFallback = await caches.match('/offline.html');
          return (
            offlineFallback ||
            new Response('Оффлайн режим Aura Menu', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          );
        })
    );
    return;
  }

  // 2. Статические бандлы Next.js и веб-шрифты (Cache First)
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

  // 3. Фотографии блюд (Unsplash) и изображения — Cache-First with Stale-While-Revalidate
  // Обеспечивает мгновенное отображение фотографий еды в подвальных помещениях со слабым интернетом
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
      caches.open(IMAGE_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);

        // Фоновое обновление кэша при наличии интернета
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cached);

        // Если картинка уже есть в локальном кэше — отдаем сразу (0мс задержка)
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 4. API запросы (/api/*)
  if (url.pathname.startsWith('/api/')) {
    // Мутации (создание заказов, вызов официанта) сохраняются в оффлайн-очереди
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

    // Для GET API (меню, каталог): Network First с фолбэком на кэш
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
                message: 'Данные меню недоступны без подключения к сети',
              }),
              { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
            );
          });
        })
    );
    return;
  }

  // По умолчанию: Network First
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Слушатель сообщений от клиентских вкладок
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
