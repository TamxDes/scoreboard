const CACHE_NAME = 'big-two-scorer-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/big-two-scoreboard.html',
  '/deuces-scorer.html',
  '/manifest.json',
];

// Install: 預緩存靜態資源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: 清理舊緩存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: 緩存優先，網絡回退
self.addEventListener('fetch', event => {
  // 跳過非 GET 請求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // 只緩存成功的同源請求
        if (response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // 離線時返回首頁作為回退
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
