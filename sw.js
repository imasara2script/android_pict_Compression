const CACHE_NAME = 'webp-compressor-v2'; // バージョンを更新
const ASSETS = [
  './index.html',
  './manifest.json'
  // ★防衛策: './sw.js' をキャッシュから完全に削除（更新されない呪いを解除）
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
        
        // ★防衛策: タイムスタンプで一意のIDを発行（複数タブでのデータ上書きを防止）
        const id = Date.now();
        const cacheKey = `shared-image-${id}`;
        await cache.put(cacheKey, new Response(file));
        
        // IDをクエリに付与してリダイレクト
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
