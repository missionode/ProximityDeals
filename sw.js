const C='pd-cache-v1';
const ASSETS=[
  '/', '/index.html','/css/styles.css',
  '/js/ui.js','/js/app.js','/js/store.js','/js/api.js','/js/proximity.js',
  '/js/scanner.js','/js/crypto.js','/js/security.js','/js/charges.js','/js/appeals.js','/js/referrals.js','/js/upi.js',
  '/scan.html','/charges.html','/appeals.html','/referrals.html','/upi.html'
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))))});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
