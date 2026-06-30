const CACHE_NAME = 'webp-compressor-v3'; // バージョンを更新
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon.svg' // キャッシュ対象に追加
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

  // ★追加: アイコン画像のリクエストを横取りし、その場でダミーのSVG画像を生成して返す
  if (url.pathname.endsWith('/icon.svg')) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect width="512" height="512" fill="%2300ffcc"/><text x="256" y="320" font-family="sans-serif" font-size="220" font-weight="bold" fill="%23121212" text-anchor="middle">W</text></svg>`;
    event.respondWith(new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } }));
    return;
  }

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
