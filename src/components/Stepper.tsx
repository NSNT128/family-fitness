import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'

interface StepperProps {
  label: string
  value: number | null
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  unit?: string
  decimals?: number
  placeholder?: number
}

/**
 * Big +/- buttons so a value can be set without the keyboard. Holding a
 * button repeats and speeds up, so a long way from the default is still quick.
 * The number itself can be tapped to type, as an escape hatch.
 */
export default function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  unit = '',
  decimals = 0,
  placeholder = 0,
}: StepperProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const current = value ?? placeholder

  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  const round = (n: number) => Number(n.toFixed(decimals))

  const stopRepeat = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }

  const startRepeat = (direction: 1 | -1) => {
    stopRepeat()
    // Track the value locally: the repeat outruns React's re-renders, so
    // reading `current` again each tick would keep re-applying a stale value.
    // From unset, the first press commits the suggested value itself rather than
    // stepping past it — tapping + on an empty birth year should land on 1990.
    let latest = value === null ? round(clamp(placeholder)) : round(clamp(current + direction * step))
    onChange(latest)
    let delay = 400
    const tick = () => {
      const next = round(clamp(latest + direction * step))
      if (next === latest) return stopRepeat()
      latest = next
      onChange(latest)
      delay = Math.max(45, delay * 0.82)
      timer.current = setTimeout(tick, delay)
    }
    timer.current = setTimeout(tick, delay)
  }

  useEffect(() => stopRepeat, [])

  const parseDraft = (text: string): number | null => {
    const parsed = parseFloat(text.replace(',', '.'))
    return Number.isNaN(parsed) ? null : parsed
  }

  /**
   * Push each keystroke up as well as holding it locally. Committing only on blur
   * lost the value whenever the next tap was the Save button — the save handler
   * read the old state before the field's blur had landed.
   */
  const editDraft = (text: string) => {
    setDraft(text)
    const parsed = parseDraft(text)
    if (parsed !== null) onChange(round(clamp(parsed)))
  }

  const commitDraft = () => {
    const parsed = parseDraft(draft)
    if (parsed !== null) onChange(round(clamp(parsed)))
    setEditing(false)
  }

  const buttonClass =
    'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100 ' +
    'text-gray-700 transition active:scale-95 active:bg-gray-200 disabled:opacity-30'

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-600">{label}</p>
      <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          className={buttonClass}
          disabled={current <= min}
          onPointerDown={() => startRepeat(-1)}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          onPointerCancel={stopRepeat}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Minus className="h-6 w-6" strokeWidth={2.6} />
        </button>

        {editing ? (
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            value={draft}
            onChange={(e) => editDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => e.key === 'Enter' && commitDraft()}
            className="min-w-0 flex-1 rounded-lg border border-brand-300 bg-surface text-center text-2xl font-bold tabular-nums text-gray-900 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              // Start empty when unset, so the suggested number can't be adopted
              // by accident — you type your own.
              setDraft(value === null ? '' : String(current))
              setEditing(true)
            }}
            className="min-w-0 flex-1 text-center"
          >
            {value === null ? (
              // Never render the placeholder as if it were a stored value: it read
              // as a real birth year, so Save quietly wrote nothing.
              <span className="text-2xl font-bold tabular-nums text-gray-300">—</span>
            ) : (
              <>
                <span className="text-2xl font-bold tabular-nums text-gray-900">
                  {current.toFixed(decimals)}
                </span>
                {unit && <span className="ml-1 text-base font-medium text-gray-400">{unit}</span>}
              </>
            )}
          </button>
        )}

        <button
          type="button"
          aria-label={`Increase ${label}`}
          className={buttonClass}
          disabled={current >= max}
          onPointerDown={() => startRepeat(1)}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          onPointerCancel={stopRepeat}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Plus className="h-6 w-6" strokeWidth={2.6} />
        </button>
      </div>
    </div>
  )
}
