const CACHE = "soapstone-v1";
const ASSETS = ["./", "./index.html", "./style.css", "app.js", "./icons/icon_x192.png", "./icons/icon_x512.png", "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", "https://cdn.jsdelivr.net/npm/junicode-font@1.0.2/index.min.css"];

self.addEventListener("install", installEvent => {
    installEvent.waitUntil(
        caches.open(CACHE).then(cache => {
            cache.addAll(ASSETS)
        })
    )
})

self.addEventListener("fetch", fetchEvent => {
    fetchEvent.respondWith(
        caches.match(fetchEvent.request).then(res => {
            return res || fetch(fetchEvent.request)
        })
    )
})
