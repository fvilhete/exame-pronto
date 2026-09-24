const CACHE_NAME = 'examepronto-v4.0-cache';
const IMAGE_CACHE_NAME = 'examepronto-images-v1';
const API_CACHE_NAME = 'examepronto-api-v2';
const EXT_CACHE_NAME = 'examepronto-ext-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== IMAGE_CACHE_NAME && key !== API_CACHE_NAME && key !== EXT_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = event.request.url;

  // 1. Stale-While-Revalidate para Catálogo de Exames e Provas (/api/exams e /api/exams/:id)
  // Permite resolver simuladores 100% offline sem saldo de dados
  if (url.includes('/api/exams')) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 2. Cache-First para Recursos Externos (KaTeX CDN e Google Fonts)
  if (url.includes('cdn.jsdelivr.net') || url.includes('fonts.gstatic.com') || url.includes('fonts.googleapis.com')) {
    event.respondWith(
      caches.open(EXT_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);
        });
      })
    );
    return;
  }

  // Ignorar pedidos de outras APIs dinâmicas que exigem autenticação ativa em tempo real
  if (url.includes('/api/auth/') || url.includes('/api/payments/') || url.includes('/api/vouchers/')) {
    return;
  }

  // 3. Cache-First para Imagens e Diagramas de Exames (/exam_images/)
  if (url.includes('/exam_images/')) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 4. Network-First com Fallback Offline para Ficheiros da Aplicação (App Shell)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
