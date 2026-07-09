const CACHE_NAME = "bio-builder-v2";  // Version বাড়িয়ে update
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json"
];

// Install - নতুন version cache করবে
self.addEventListener("install", function(event){
  self.skipWaiting();  // পুরনো SW এর অপেক্ষা না করে নতুনটা active
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch - Network first, cache fallback (নতুন data আগে দেখাবে)
self.addEventListener("fetch", function(event){
  event.respondWith(
    fetch(event.request)
      .then(function(response){
        // নতুন response cache এ update
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache){
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(function(){
        // Network fail হলে cache থেকে দেখাবে
        return caches.match(event.request);
      })
  );
});

// Activate - পুরনো cache delete
self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(cacheNames){
      return Promise.all(
        cacheNames.map(function(cacheName){
          if (cacheName !== CACHE_NAME){
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function(){
      return self.clients.claim();  // সাথে সাথে control নেবে
    })
  );
});