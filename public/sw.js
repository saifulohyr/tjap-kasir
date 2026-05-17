// Minimal SW — PWA install activation only
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// Pass-through fetch handler required for PWA installability in some browsers
self.addEventListener('fetch', (event) => {
  // We don't cache anything to ensure Supabase realtime works correctly
  // Just pass the request to the network
  return
})
