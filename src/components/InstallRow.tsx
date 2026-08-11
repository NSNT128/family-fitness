import { useState } from 'react'
import { Check, Download, Share } from 'lucide-react'
import { promptInstall, useInstall } from '../lib/pwaInstall'

/**
 * Permanent install entry point for the Profile page — the reliable path that
 * doesn't depend on the browser's one-shot auto-prompt. Fires the native prompt
 * when available; otherwise expands the manual home-screen steps (iOS Share menu,
 * or the browser's own "Install app" menu item). Hidden once already installed.
 */
export default function InstallRow() {
  const { canPrompt, installed, ios } = useInstall()
  const [showSteps, setShowSteps] = useState(false)
  const [justInstalled, setJustInstalled] = useState(false)

  if (installed || justInstalled) return null

  const onClick = async () => {
    if (canPrompt) {
      const outcome = await promptInstall()
      if (outcome === 'accepted') setJustInstalled(true)
    } else {
      setShowSteps((s) => !s)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
      <button
        onClick={onClick}
        className="flex w-full items-center gap-4 p-5 text-left active:scale-[0.99]"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50">
          <Download className="h-5 w-5 text-brand-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">Install app</p>
          <p className="truncate text-sm text-gray-500">
            {canPrompt ? 'Add to your home screen — one tap' : 'How to add it to your home screen'}
          </p>
        </div>
        {canPrompt && (
          <span className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            Install
          </span>
        )}
      </button>

      {showSteps && !canPrompt && (
        <div className="border-t border-gray-100 px-5 py-4">
          {ios ? (
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>
                  Tap the Share button <Share className="inline h-4 w-4 align-text-bottom" /> in
                  Safari's toolbar.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>Scroll down and tap “Add to Home Screen”.</span>
              </li>
            </ol>
          ) : (
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>Open your browser's menu (⋮ in the top corner).</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>Tap “Install app” or “Add to Home screen”.</span>
              </li>
            </ol>
          )}
        </div>
      )}
    </div>
  )
}
