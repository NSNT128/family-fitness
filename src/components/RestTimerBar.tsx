import { Check, Pause, Play, X } from 'lucide-react'
import { useRestTimer } from '../contexts/RestTimerContext'

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/**
 * Floating rest countdown, docked just above the bottom nav. Mounted once in
 * Layout so it keeps running as you move around the app. Shows a progress bar,
 * ±15s, pause/resume, and a "Rest done" state when it finishes.
 */
export default function RestTimerBar() {
  const { active, done, paused, secondsLeft, totalSeconds, adjust, togglePause, stop } =
    useRestTimer()

  if (!active && !done) return null

  const pct = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+4.75rem)]">
      <div className="pointer-events-auto mx-auto max-w-lg overflow-hidden rounded-2xl bg-panel shadow-xl">
        {done ? (
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500/20">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <p className="flex-1 font-semibold text-white">Rest done — next set!</p>
            <button
              onClick={stop}
              aria-label="Dismiss"
              className="shrink-0 rounded-lg p-1.5 text-gray-400 active:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-2xl font-bold tabular-nums text-white">{fmt(secondsLeft)}</span>
              <span className="flex-1 text-sm font-medium text-gray-400">Rest</span>
              <button
                onClick={() => adjust(-15)}
                className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white active:bg-white/20"
              >
                −15s
              </button>
              <button
                onClick={() => adjust(15)}
                className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white active:bg-white/20"
              >
                +15s
              </button>
              <button
                onClick={togglePause}
                aria-label={paused ? 'Resume' : 'Pause'}
                className="shrink-0 rounded-lg p-1.5 text-white active:bg-white/10"
              >
                {paused ? <Play className="h-5 w-5 fill-white" strokeWidth={0} /> : <Pause className="h-5 w-5" />}
              </button>
              <button
                onClick={stop}
                aria-label="Stop rest timer"
                className="shrink-0 rounded-lg p-1.5 text-gray-400 active:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-1 w-full bg-white/10">
              <div
                className="h-full bg-brand-500 transition-[width] duration-300 ease-linear"
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
