import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronDown, Loader2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import LogEntrySheet from '../components/LogEntrySheet'
import type { LogValues } from '../components/LogEntrySheet'
import { deleteLog, fetchAllLogs, formatLogDate, groupByDate, updateLog } from '../lib/logs'
import type { WorkoutLog } from '../lib/types'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<WorkoutLog | null>(null)

  const load = useCallback(async () => {
    try {
      setLogs(await fetchAllLogs())
    } catch {
      setError('Could not load your history.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sessions = useMemo(() => groupByDate(logs), [logs])

  // The most recent session starts open — that's the one you just finished.
  useEffect(() => {
    if (sessions.length > 0) setExpanded(new Set([sessions[0].date]))
  }, [sessions.length])

  const toggle = (date: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })

  const handleSave = async (values: LogValues) => {
    if (!editing) return
    await updateLog(editing.id, values)
    await load()
  }

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
        title="History"
        subtitle={
          sessions.length > 0
            ? `${sessions.length} session${sessions.length === 1 ? '' : 's'} logged`
            : undefined
        }
      />

      <div className="px-5 py-2">
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-surface px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
              <CalendarDays className="h-7 w-7 text-brand-600" />
            </div>
            <p className="font-semibold text-gray-900">No workouts yet</p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Once you log a session it'll show up here, grouped by date.
            </p>
            <button
              onClick={() => navigate('/log')}
              className="mt-5 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white active:scale-[0.98]"
            >
              Log a workout
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const isOpen = expanded.has(session.date)
              const exerciseCount = new Set(session.logs.map((l) => l.exercise_name)).size
              const setCount = session.logs.length
              return (
                <section key={session.date} className="overflow-hidden rounded-2xl bg-surface shadow-sm">
                  <button
                    onClick={() => toggle(session.date)}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left active:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900">{formatLogDate(session.date)}</p>
                      <p className="mt-0.5 truncate text-sm text-gray-500">
                        {session.dayNames.length > 0 && `${session.dayNames.join(', ')} · `}
                        {exerciseCount} exercise{exerciseCount === 1 ? '' : 's'}
                        {setCount !== exerciseCount && ` · ${setCount} sets`} ·{' '}
                        {session.totalVolume.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}{' '}
                        kg
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <ul className="border-t border-gray-100">
                      {session.logs.map((log) => (
                        <li key={log.id}>
                          <button
                            onClick={() => setEditing(log)}
                            className="flex w-full items-start gap-3 border-b border-gray-50 px-5 py-3.5 text-left last:border-b-0 active:bg-gray-50"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-gray-900">
                                {log.exercise_name}
                              </p>
                              <p className="mt-0.5 text-sm text-gray-500">
                                {Number(log.weight_kg)} kg × {log.reps} reps × {log.sets} sets
                                {log.rpe !== null && ` · RPE ${Number(log.rpe)}`}
                              </p>
                              {log.notes && (
                                <p className="mt-1 text-sm italic text-gray-400">“{log.notes}”</p>
                              )}
                            </div>
                            <span className="shrink-0 text-sm font-bold tabular-nums text-gray-900">
                              {Number(log.volume).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}{' '}
                              kg
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>

      <LogEntrySheet
        open={editing !== null}
        exerciseName={editing?.exercise_name ?? ''}
        existing={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        onDelete={async () => {
          if (!editing) return
          await deleteLog(editing.id)
          await load()
        }}
      />
    </div>
  )
}
