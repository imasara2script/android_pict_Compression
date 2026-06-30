const CACHE_NAME = 'webp-compressor-v5'; // バージョン更新
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon.svg' // 実ファイルをキャッシュに含める
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // スクショ共有のPOSTリクエストをフック
  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const file = formData.get('images');
        
        const cache = await caches.open(CACHE_NAME);
        const id = Date.now();
        const cacheKey = `shared-image-${id}`;
        await cache.put(cacheKey, new Response(file));
        
        return Response.redirect(`./index.html?shared=${id}`, 303);
      } catch (err) {
        return new Response('共有画像の取得に失敗: ' + err.message, { status: 500 });
      }
    })());
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => new Response('Offline'));
    })
  );
});
