/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

// ── App-shell precache (same offline behaviour as before) ───────────────────
precacheAndRoute(self.__WB_MANIFEST)
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/auth/],
  }),
)

self.skipWaiting()
clientsClaim()

// ── Rest-timer notifications ────────────────────────────────────────────────
// Fallback path for browsers without the Notification Triggers API: hold a
// setTimeout in the SW. Best-effort — the browser may terminate the worker
// before it fires (the page also fires on its own when it's in the foreground).
let restTimeout: ReturnType<typeof setTimeout> | null = null

const DONE_TAG = 'rest-done'

function showDone() {
  self.registration.showNotification('Rest done 💪', {
    body: 'Time for your next set.',
    tag: DONE_TAG,
    renotify: true,
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    vibrate: [200, 100, 200],
  } as NotificationOptions)
}

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data ?? {}
  if (data.type === 'REST_SCHEDULE') {
    if (restTimeout) clearTimeout(restTimeout)
    const delay = data.fireAt - Date.now()
    if (delay <= 0) showDone()
    else restTimeout = setTimeout(showDone, delay)
  } else if (data.type === 'REST_CANCEL') {
    if (restTimeout) {
      clearTimeout(restTimeout)
      restTimeout = null
    }
  }
})

// Tapping any of our notifications focuses the app (or opens it).
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow('/')
    }),
  )
})
