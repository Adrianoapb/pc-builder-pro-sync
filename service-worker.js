/**
 * PC Builder Pro - Service Worker
 * Versão: 1.0.0
 * Garante funcionamento 100% offline
 */

const CACHE_NAME = 'pcbuilder-v2.0.0';
const STATIC_CACHE = 'pcbuilder-static-v2';
const DYNAMIC_CACHE = 'pcbuilder-dynamic-v2';

// Arquivos essenciais para cache offline
const STATIC_FILES = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/db.js',
  '/js/dashboard.js',
  '/js/builds.js',
  '/js/parts.js',
  '/js/comparator.js',
  '/js/shopping.js',
  '/js/reports.js',
  '/js/settings.js',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ===================== INSTALL =====================
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Cacheando arquivos estáticos');
      return cache.addAll(STATIC_FILES.map(url => new Request(url, { cache: 'reload' })));
    }).then(() => {
      console.log('[SW] Instalação concluída');
      return self.skipWaiting();
    }).catch((err) => {
      console.warn('[SW] Alguns arquivos não puderam ser cacheados:', err);
      return self.skipWaiting();
    })
  );
});

// ===================== ACTIVATE =====================
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map(name => {
            console.log('[SW] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Service Worker ativo');
      return self.clients.claim();
    })
  );
});

// ===================== FETCH =====================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-GET e de outros domínios
  if (request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // Estratégia: Cache First, depois Network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Atualiza cache em background
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, networkResponse.clone());
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // Se não está em cache, busca na rede
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        // Salva no cache dinâmico
        const responseClone = networkResponse.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback para index.html se navegação
        if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ===================== MESSAGE =====================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
