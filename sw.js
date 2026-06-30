const ASSET_CACHE = 'webp-compressor-v6'; // バージョンを上げて古いキャッシュと決別
const SHARED_CACHE = 'webp-shared-cache';   // 共有画像専用の隔離ボックス

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(ASSET_CACHE).then((cache) => cache.addAll(['./', './index.html', './manifest.json'])));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== ASSET_CACHE && key !== SHARED_CACHE) return caches.delete(key);
      })
    ))
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 共有ターゲット受け取り（絶対URLによる固定キー保存）
  if (url.pathname.endsWith('/share-target') && e.request.method === 'POST') {
    e.respondWith((async () => {
      try {
        const formData = await e.request.formData();
        const file = formData.get('image') || formData.get('file');
        if (file) {
          const sharedId = Date.now().toString();
          const cache = await caches.open(SHARED_CACHE);
          // オリジン起点で固定キーを作成
          const cacheKey = new URL(`shared-image-${sharedId}`, self.location.origin).href;
          await cache.put(cacheKey, new Response(file, { headers: { 'Content-Type': file.type } }));
          return Response.redirect(`./?shared=${sharedId}`, 303);
        }
      } catch (err) { console.error(err); }
      return Response.redirect('./', 303);
    })());
    return;
  }

  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
