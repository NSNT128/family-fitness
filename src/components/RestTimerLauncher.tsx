import { Timer } from 'lucide-react'
import { useRestTimer } from '../contexts/RestTimerContext'

const PRESETS = [60, 90, 120, 180]
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** Preset chips to start a rest countdown; the running timer shows in RestTimerBar. */
export default function RestTimerLauncher() {
  const { start } = useRestTimer()
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Timer className="h-4 w-4 text-brand-600" />
        <p className="text-sm font-medium text-gray-600">Rest timer</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((s) => (
          <button
            key={s}
            onClick={() => start(s)}
            className="rounded-xl bg-gray-100 py-2.5 text-sm font-semibold tabular-nums text-gray-700 active:bg-gray-200"
          >
            {fmt(s)}
          </button>
        ))}
      </div>
    </div>
  )
}
