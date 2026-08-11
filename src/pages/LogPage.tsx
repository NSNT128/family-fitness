import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Dumbbell, LayoutGrid, Loader2, Timer } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { fetchActiveSplit, fetchLogsOn, todayISO } from '../lib/logs'
import type { Split, WorkoutLog } from '../lib/types'

export default function LogPage() {
  const navigate = useNavigate()
  const [split, setSplit] = useState<Split | null>(null)
  const [todayLogs, setTodayLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [activeSplit, logs] = await Promise.all([fetchActiveSplit(), fetchLogsOn(todayISO())])
      setSplit(activeSplit)
      setTodayLogs(logs)
    } catch {
      setError('Could not load your split.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Log workout"
        subtitle={split ? `Active split: ${split.name}` : undefined}
      />

      <div className="px-5 py-2">
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {!split ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-surface px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
              <LayoutGrid className="h-7 w-7 text-brand-600" />
            </div>
            <p className="font-semibold text-gray-900">No active split yet</p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Pick which days you train and what's on each one, then come back here to log.
            </p>
            <button
              onClick={() => navigate('/profile/splits')}
              className="mt-5 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white active:scale-[0.98]"
            >
              Set up a split
            </button>
          </div>
        ) : split.split_days.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-surface px-6 py-10 text-center">
            <p className="font-semibold text-gray-900">"{split.name}" has no days yet</p>
            <button
              onClick={() => navigate(`/profile/splits/${split.id}`)}
              className="mt-4 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white active:scale-[0.98]"
            >
              Add days
            </button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm font-medium text-gray-600">What are you training today?</p>
            <div className="space-y-3">
              {split.split_days.map((day) => {
                const loggedToday = todayLogs.filter((l) => l.day_name === day.name).length
                return (
                  <button
                    key={day.id}
                    onClick={() => navigate(`/log/${day.id}`)}
                    className="flex w-full items-center gap-4 rounded-2xl bg-surface p-5 text-left shadow-sm active:scale-[0.99]"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                      <Dumbbell className="h-6 w-6 text-brand-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-semibold text-gray-900">{day.name}</p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {day.split_day_exercises.length} exercise
                        {day.split_day_exercises.length === 1 ? '' : 's'}
                        {loggedToday > 0 && (
                          <span className="font-medium text-green-600">
                            {' '}
                            · {loggedToday} logged today
                          </span>
                        )}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
                  </button>
                )
              })}
            </div>
          </>
        )}

        <button
          onClick={() => navigate('/cardio')}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left shadow-sm active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50">
            <Timer className="h-6 w-6 text-orange-500" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-gray-900">Cardio</p>
            <p className="mt-0.5 text-sm text-gray-500">Run, ride or walk — distance and calories</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
        </button>
      </div>
    </div>
  )
}
