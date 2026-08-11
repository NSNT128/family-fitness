import { useSyncExternalStore } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const isStandalone = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari's non-standard flag when launched from the home screen.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true)

export const isIOS = (): boolean =>
  typeof window !== 'undefined' &&
  /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) &&
  !(window.navigator as unknown as { MSStream?: unknown }).MSStream

// ── Tiny external store ─────────────────────────────────────────────────────
// beforeinstallprompt fires ONCE, early, and only its live listener sees it — so
// we capture it at module load (imported from main.tsx) rather than inside a
// component that might mount too late. Components subscribe via useInstall().

interface InstallState {
  canPrompt: boolean // native install prompt is available to fire
  installed: boolean // running as / just became an installed app
}

let deferred: BeforeInstallPromptEvent | null = null
let snapshot: InstallState = { canPrompt: false, installed: isStandalone() }
const listeners = new Set<() => void>()

const set = (next: InstallState) => {
  snapshot = next
  listeners.forEach((l) => l())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    set({ canPrompt: true, installed: snapshot.installed })
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    set({ canPrompt: false, installed: true })
  })
  // One-time cleanup of the old permanent-dismiss flag from an earlier build.
  localStorage.removeItem('ff-install-dismissed')
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const getSnapshot = () => snapshot

/** Fire the native install prompt. Returns 'unavailable' when the browser hasn't offered one. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable'
  await deferred.prompt()
  const { outcome } = await deferred.userChoice
  deferred = null
  set({ canPrompt: false, installed: snapshot.installed })
  return outcome
}

export function useInstall() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return { ...state, ios: isIOS() }
}
