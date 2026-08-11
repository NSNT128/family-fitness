import { useState } from 'react'
import { Share, X } from 'lucide-react'
import { promptInstall, useInstall } from '../lib/pwaInstall'

// Snooze the banner for a week rather than hiding it forever — and there's always
// a permanent "Install app" entry in Profile as the reliable fallback.
const SNOOZE_KEY = 'ff-install-snooze'
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000

const snoozed = () => {
  const until = Number(localStorage.getItem(SNOOZE_KEY) ?? 0)
  return Date.now() < until
}

export default function InstallPrompt() {
  const { canPrompt, installed, ios } = useInstall()
  const [hidden, setHidden] = useState(snoozed)

  const snooze = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS))
    setHidden(true)
  }

  const install = async () => {
    const outcome = await promptInstall()
    if (outcome === 'accepted') setHidden(true)
  }

  // Show only when installable and not already an app: native prompt (Android)
  // or the manual-steps nudge on iOS.
  if (installed || hidden || (!canPrompt && !ios)) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+5rem)]">
      <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-gray-200 bg-surface p-4 shadow-xl">
        <img src="/pwa-192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">Add to Home Screen</p>
          {canPrompt ? (
            <p className="mt-0.5 text-sm text-gray-500">Install the app for one-tap access.</p>
          ) : (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
              Tap <Share className="inline h-4 w-4" /> then “Add to Home Screen”.
            </p>
          )}
        </div>
        {canPrompt && (
          <button
            onClick={install}
            className="shrink-0 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white active:scale-95"
          >
            Install
          </button>
        )}
        <button
          onClick={snooze}
          aria-label="Dismiss"
          className="shrink-0 rounded-lg p-1.5 text-gray-400 active:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
