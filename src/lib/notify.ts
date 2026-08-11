// Rest-timer notifications. Everything here degrades gracefully: if the browser
// lacks notifications/service-worker, or permission isn't granted, these all
// no-op and the in-app beep + vibration still fire.

const RUN_TAG = 'rest-run'
const DONE_TAG = 'rest-done'
const ICON = '/pwa-192.png'

type NotifOpts = NotificationOptions & { vibrate?: number[]; showTrigger?: unknown; renotify?: boolean }

const supported = () =>
  typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window

const granted = () => supported() && Notification.permission === 'granted'

async function getReg(): Promise<ServiceWorkerRegistration | null> {
  if (!supported()) return null
  try {
    return (await navigator.serviceWorker.getRegistration()) ?? null
  } catch {
    return null
  }
}

/** Ask once, from the user gesture that starts a timer. */
export async function ensureNotifyPermission(): Promise<boolean> {
  if (!supported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    return (await Notification.requestPermission()) === 'granted'
  } catch {
    return false
  }
}

const clock = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })
const mmss = (s: number) =>
  `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`

/** Ongoing, silent notification so a tabbed-out user can see when rest ends. */
export async function showRunning(endAt: number, secondsLeft: number) {
  if (!granted()) return
  const r = await getReg()
  if (!r) return
  const opts: NotifOpts = {
    body: `${mmss(secondsLeft)} left · ends ${clock(endAt)}`,
    tag: RUN_TAG,
    silent: true,
    requireInteraction: true,
    renotify: false,
    icon: ICON,
    badge: ICON,
  }
  try {
    await r.showNotification('Resting', opts)
  } catch {
    /* ignore */
  }
}

/**
 * Schedule the finish alert. Prefers the Notification Triggers API, which the OS
 * fires at the target time even if the tab is frozen or closed. Falls back to a
 * service-worker timer (best-effort — the worker can be killed before it fires;
 * the page also fires on its own whenever it's still alive).
 */
export async function scheduleDone(endAt: number) {
  if (!granted()) return
  const r = await getReg()
  if (!r) return
  const canTrigger = 'showTrigger' in Notification.prototype && 'TimestampTrigger' in window
  if (canTrigger) {
    try {
      const Trigger = (window as unknown as { TimestampTrigger: new (t: number) => unknown })
        .TimestampTrigger
      const opts: NotifOpts = {
        body: 'Time for your next set.',
        tag: DONE_TAG,
        icon: ICON,
        badge: ICON,
        vibrate: [200, 100, 200],
        showTrigger: new Trigger(endAt),
      }
      await r.showNotification('Rest done 💪', opts)
      return
    } catch {
      /* fall through to SW timer */
    }
  }
  r.active?.postMessage({ type: 'REST_SCHEDULE', fireAt: endAt })
}

/** Show the finish alert immediately (used when the page itself reaches zero). */
export async function fireDoneNow() {
  if (!granted()) return
  const r = await getReg()
  if (!r) return
  const opts: NotifOpts = {
    body: 'Time for your next set.',
    tag: DONE_TAG,
    renotify: true,
    icon: ICON,
    badge: ICON,
    vibrate: [200, 100, 200],
  }
  try {
    await r.showNotification('Rest done 💪', opts)
  } catch {
    /* ignore */
  }
}

export async function cancelDone() {
  const r = await getReg()
  if (!r) return
  r.active?.postMessage({ type: 'REST_CANCEL' })
  try {
    const pending = await (
      r as unknown as { getNotifications: (o: unknown) => Promise<Notification[]> }
    ).getNotifications({ tag: DONE_TAG, includeTriggered: true })
    pending.forEach((n) => n.close())
  } catch {
    /* ignore */
  }
}

export async function closeRunning() {
  const r = await getReg()
  if (!r) return
  try {
    ;(await r.getNotifications({ tag: RUN_TAG })).forEach((n) => n.close())
  } catch {
    /* ignore */
  }
}
