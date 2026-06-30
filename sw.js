const ASSET_CACHE = 'webp-compressor-v7'; // 👑 v7に上げて古い裏方を強制全入れ替え
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

  // 👑 共有ターゲット受け取りルート
  if (url.pathname.endsWith('/share-target') && e.request.method === 'POST') {
    e.respondWith((async () => {
      try {
        const formData = await e.request.formData();
        // ✨ 修正1: manifest.json の name: "images" と完全に一致させる
        const file = formData.get('images'); 
        
        if (file) {
          const sharedId = Date.now().toString();
          const cache = await caches.open(SHARED_CACHE);
          
          // ✨ 修正2: フロントエンド（index.html）の検索パスと1文字違わず一致させる
          const cacheKey = self.location.origin + '/android_pict_Compression/shared-image-' + sharedId;
          
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
