const CACHE_NAME = 'webp-compressor-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './sw.js'
];

// 1. 初回アクセス時にすべてのファイルをローカルにキャッシュ（完全オフライン化）
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// 2. 通信をインターセプトして処理
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // スクショ共有（Share Target）のPOSTリクエストをフック
  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const file = formData.get('images');
        
        // 受信した画像をキャッシュに一時保存
        const cache = await caches.open(CACHE_NAME);
        await cache.put('shared-image', new Response(file));
        
        // アプリ本体に「共有から来たよ」という目印（クエリパラメータ）をつけてリダイレクト
        return Response.redirect('./index.html?shared=true', 303);
      } catch (err) {
        return new Response('共有画像の取得に失敗: ' + err.message, { status: 500 });
      }
    })());
    return;
  }

  // 通常のページ閲覧は常にローカルキャッシュから高速読み込み（通信なし）
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});