/* ============================================================
   Service Worker · Calculadora Credixpertos
   Es el "ayudante" que guarda una copia de la app en el telefono
   para que funcione aunque no haya internet.
   ============================================================ */

// Nombre del cache. Si algun dia cambias archivos y quieres forzar
// que a TODOS les llegue la version nueva limpia, sube el numero (v1 -> v2).
const CACHE = 'credixpertos-calc-v1';

// Archivos que se guardan desde el primer momento (el "esqueleto" de la app).
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

// 1) INSTALACION: al registrarse, guarda los archivos base en el cache.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// 2) ACTIVACION: borra caches viejos (de versiones anteriores) y toma control.
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 3) PETICIONES: decide de donde sacar cada archivo.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return; // solo lecturas

  // Para la pagina principal: primero intenta la RED (asi siempre llega la
  // version mas reciente cuando hay internet) y guarda una copia para offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html')) // sin senal -> usa la copia guardada
    );
    return;
  }

  // Para los demas recursos (iconos, etc.): primero el CACHE (rapido),
  // y si no esta, lo busca en la red.
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
