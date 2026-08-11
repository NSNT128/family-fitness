import { useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarPlus, CheckCircle2, Play } from 'lucide-react'
import type { SplitDay } from '../lib/types'

/**
 * The home screen's primary action: what to train next, tapping straight into
 * logging. Handles three states — no active split, an active split with no days,
 * and the normal "here's your next day" case (with a nod when you've already
 * trained today).
 */
export default function NextUpCard({
  day,
  trainedToday,
  hasActiveSplit,
}: {
  day: SplitDay | null
  trainedToday: boolean
  hasActiveSplit: boolean
}) {
  const navigate = useNavigate()

  if (!hasActiveSplit) {
    return (
      <button
        onClick={() => navigate('/profile/splits')}
        className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-surface p-5 text-left active:bg-gray-50"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50">
          <CalendarPlus className="h-6 w-6 text-brand-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">Set up your split</p>
          <p className="mt-0.5 text-sm text-gray-500">
            Pick a training plan so the app knows what to suggest next.
          </p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-gray-400" />
      </button>
    )
  }

  if (!day) {
    return (
      <button
        onClick={() => navigate('/profile/splits')}
        className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-surface p-5 text-left active:bg-gray-50"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50">
          <CalendarPlus className="h-6 w-6 text-brand-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">Add days to your split</p>
          <p className="mt-0.5 text-sm text-gray-500">Your active split doesn't have any days yet.</p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-gray-400" />
      </button>
    )
  }

  const exerciseNames = day.split_day_exercises
    .map((e) => e.exercises?.name)
    .filter((n): n is string => Boolean(n))
  const preview =
    exerciseNames.slice(0, 3).join(' · ') +
    (exerciseNames.length > 3 ? ` · +${exerciseNames.length - 3} more` : '')

  return (
    <button
      onClick={() => navigate(`/log/${day.id}`)}
      className="block w-full overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-left shadow-lg shadow-brand-600/25 active:scale-[0.99]"
    >
      <div className="flex items-center gap-2">
        {trainedToday && <CheckCircle2 className="h-4 w-4 text-brand-100" />}
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">
          {trainedToday ? 'Trained today · up next' : 'Next up'}
        </p>
      </div>

      <h2 className="mt-1 text-2xl font-bold text-white">{day.name}</h2>
      {preview && <p className="mt-1 line-clamp-2 text-sm text-brand-100">{preview}</p>}

      <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white/15 py-3 text-base font-semibold text-white backdrop-blur">
        <Play className="h-5 w-5 fill-white" strokeWidth={0} />
        {trainedToday ? 'Log another session' : 'Start workout'}
      </div>
    </button>
  )
}
