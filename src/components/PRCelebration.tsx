import { useEffect } from 'react'
import { Trophy, X } from 'lucide-react'

export interface PRWin {
  name: string
  kind: 'weight' | 'volume'
  value: number
  prev: number
}

const CONFETTI_COLORS = ['#1b6ef5', '#f97316', '#22c55e', '#eab308', '#ec4899', '#8b5cf6']

/** Celebratory overlay shown when a saved set beats a personal record. */
export default function PRCelebration({ win, onClose }: { win: PRWin | null; onClose: () => void }) {
  useEffect(() => {
    if (!win) return
    navigator.vibrate?.([80, 40, 80, 40, 160])
    const t = setTimeout(onClose, 4500)
    return () => clearTimeout(t)
  }, [win, onClose])

  if (!win) return null

  const fmt = (n: number) =>
    win.kind === 'weight' ? `${n.toFixed(1)} kg` : `${Math.round(n).toLocaleString()} kg`

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-6"
      onClick={onClose}
    >
      {/* confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="pr-confetti"
            style={{
              left: `${(i * 37) % 100}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDelay: `${(i % 7) * 0.12}s`,
              animationDuration: `${1.8 + ((i * 13) % 12) / 10}s`,
            }}
          />
        ))}
      </div>

      <div
        className="pr-pop relative w-full max-w-xs rounded-3xl bg-surface p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 active:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
          <Trophy className="h-8 w-8 text-brand-600" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          New {win.kind} PR! 🎉
        </p>
        <p className="mt-1 text-xl font-bold text-gray-900">{win.name}</p>
        <p className="mt-2 text-3xl font-extrabold tabular-nums text-gray-900">{fmt(win.value)}</p>
        <p className="mt-1 text-sm text-gray-500">
          up from {fmt(win.prev)} — keep it going!
        </p>
      </div>
    </div>
  )
}
