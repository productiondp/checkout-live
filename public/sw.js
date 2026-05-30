// Checkout PWA Service Worker — Static-Only Cache Strategy
// Auth, API, and Supabase requests are NEVER cached — always network-only.

const CACHE_NAME = 'checkout-static-v3';

// Pre-cache these on install
const PRECACHE = ['/manifest.json', '/logo.png', '/app-icon.png', '/favicon.png', '/apple-touch-icon.png'];

// These URL patterns are ALWAYS passed through to the network — no caching ever
const BYPASS_PATTERNS = [
  /\/api\//,           // All API routes
  /supabase\.co/,      // Supabase backend
  /\.supabase\./,      // Supabase subdomains
  /\/auth\//,          // Auth routes
  /\/onboarding/,      // Onboarding (auth-gated)
  /chrome-extension/,  // Browser internals
  /localhost.*\/_next\/webpack-hmr/, // HMR in dev
];

// Only these extensions get cached (static assets only)
const CACHEABLE_EXTENSION = /\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|ttf|webp|avif|gif)(\?.*)?$/;

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Soft pre-cache — failures don't block install
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    )
  );
});

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Take control of all pages immediately
      clients.claim(),
      // Purge old cache versions
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      ),
    ])
  );
});

// ─── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET — pass through everything else (POST for auth, etc.)
  if (request.method !== 'GET') return;

  // Bypass: auth-sensitive or dynamic patterns
  if (BYPASS_PATTERNS.some((pattern) => pattern.test(request.url))) return;

  // ── Static Assets: Cache-First ──────────────────────────────────────────
  if (CACHEABLE_EXTENSION.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request)
          .then((response) => {
            // Only cache valid responses from same origin or known CDNs
            if (
              response &&
              response.status === 200 &&
              response.type !== 'opaque'
            ) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => {
            // Return cached version if network fails
            return cached || new Response('', { status: 408 });
          });
      })
    );
    return;
  }

  // ── HTML Pages: Network-First (critical for auth state accuracy) ────────
  // Never return stale HTML — auth redirects must always be live
  event.respondWith(
    fetch(request).catch(() => caches.match(request).then(cached => cached || new Response('Network Error', { status: 503 })))
  );
});
