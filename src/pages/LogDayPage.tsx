import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, ChevronRight, Loader2, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import SubHeader from '../components/SubHeader'
import LogEntrySheet from '../components/LogEntrySheet'
import ExercisePicker from '../components/ExercisePicker'
import RestTimerLauncher from '../components/RestTimerLauncher'
import PRCelebration, { type PRWin } from '../components/PRCelebration'
import { fetchPRsByExercise } from '../lib/prs'
import type { LogValues } from '../components/LogEntrySheet'
import {
  createLog,
  deleteLog,
  fetchActiveSplit,
  fetchLastEntries,
  fetchLogsOn,
  formatLogDate,
  todayISO,
  updateLog,
} from '../lib/logs'
import { createCustomExercise, fetchExercises } from '../lib/splits'
import { supabase } from '../lib/supabase'
import { calorieInputs, sumCalories, type CalorieInputs } from '../lib/calories'
import ExerciseArtTile from '../components/ExerciseArtTile'
import type { Exercise, SplitDay, WorkoutLog } from '../lib/types'

export default function LogDayPage() {
  const { dayId } = useParams<{ dayId: string }>()
  const { session } = useAuth()

  const [day, setDay] = useState<SplitDay | null>(null)
  const [date, setDate] = useState(todayISO())
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [lastEntries, setLastEntries] = useState<Record<string, WorkoutLog>>({})
  const [library, setLibrary] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [active, setActive] = useState<{
    exercise: Exercise
    existing: WorkoutLog | null
    /** What a brand-new set opens pre-filled with (last set this session, else last time). */
    prefill?: WorkoutLog | null
  } | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [celebration, setCelebration] = useState<PRWin | null>(null)
  const [calInputs, setCalInputs] = useState<CalorieInputs | null>(null)

  // Body stats for the calorie estimate (latest weigh-in preferred).
  useEffect(() => {
    if (!session) return
    ;(async () => {
      const [{ data: prof }, { data: weight }] = await Promise.all([
        supabase
          .from('profiles')
          .select('birth_year, height_cm, starting_weight_kg')
          .eq('id', session.user.id)
          .single(),
        supabase
          .from('body_weights')
          .select('weight_kg')
          .order('logged_on', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      setCalInputs(calorieInputs(prof, weight ? Number(weight.weight_kg) : null))
    })()
  }, [session])

  const loadDay = useCallback(async () => {
    try {
      const split = await fetchActiveSplit()
      const found = split?.split_days.find((d) => d.id === dayId) ?? null
      setDay(found)
      if (found) {
        const ids = found.split_day_exercises.map((r) => r.exercise_id)
        setLastEntries(await fetchLastEntries(ids))
      }
      setLibrary(await fetchExercises())
    } catch {
      setError('Could not load this day.')
    }
  }, [dayId])

  const loadLogs = useCallback(async () => {
    try {
      setLogs(await fetchLogsOn(date))
    } catch {
      setError('Could not load that date.')
    }
  }, [date])

  useEffect(() => {
    loadDay().finally(() => setLoading(false))
  }, [loadDay])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const planExercises = useMemo(
    () => day?.split_day_exercises.map((r) => r.exercises) ?? [],
    [day],
  )

  /** Anything logged on this date that isn't part of the planned day. */
  const extras = useMemo(() => {
    const planIds = new Set(planExercises.map((e) => e.id))
    const seen = new Map<string, Exercise>()
    for (const log of logs) {
      if (log.exercise_id && !planIds.has(log.exercise_id) && !seen.has(log.exercise_id)) {
        const match = library.find((e) => e.id === log.exercise_id)
        if (match) seen.set(log.exercise_id, match)
      }
    }
    return [...seen.values()]
  }, [logs, planExercises, library])

  /** Every set logged for this exercise on this date, in the order they were added. */
  const logsFor = (exerciseId: string) => logs.filter((l) => l.exercise_id === exerciseId)

  const handleSave = async (values: LogValues) => {
    if (!session || !active) return
    if (active.existing) {
      await updateLog(active.existing.id, values)
    } else {
      // Grab the record *before* saving — the DB trigger updates it on insert.
      const prevPR = await fetchPRsByExercise(active.exercise.id).catch(() => null)
      await createLog(session.user.id, {
        logged_on: date,
        day_name: day?.name ?? null,
        exercise_id: active.exercise.id,
        exercise_name: active.exercise.name,
        ...values,
      })
      // Celebrate only when a real previous best was beaten (not the first-ever log).
      if (prevPR) {
        const newVolume = values.weight_kg * values.reps * values.sets
        if (values.weight_kg > prevPR.best_weight_kg) {
          setCelebration({
            name: active.exercise.name,
            kind: 'weight',
            value: values.weight_kg,
            prev: prevPR.best_weight_kg,
          })
        } else if (newVolume > prevPR.best_volume_kg) {
          setCelebration({
            name: active.exercise.name,
            kind: 'volume',
            value: newVolume,
            prev: prevPR.best_volume_kg,
          })
        }
      }
    }
    await Promise.all([loadLogs(), loadDay()])
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  if (!day) {
    return (
      <div>
        <SubHeader title="Log" />
        <p className="px-5 py-8 text-center text-gray-500">This day is no longer in your split.</p>
      </div>
    )
  }

  const doneCount = planExercises.filter((e) => logsFor(e.id).length > 0).length

  const renderRow = (exercise: Exercise) => {
    const setLogs = logsFor(exercise.id)
    const last = lastEntries[exercise.id]
    const done = setLogs.length > 0
    const exVolume = setLogs.reduce((sum, l) => sum + Number(l.volume), 0)
    // A new set opens pre-filled from your previous set this session, else last time.
    const prefill = done ? setLogs[setLogs.length - 1] : (last ?? null)

    return (
      <div key={exercise.id} className="border-t border-gray-100 first:border-t-0">
        <div className="flex items-center gap-3 px-4 pb-1 pt-4">
          <span className="relative shrink-0">
            <ExerciseArtTile
              name={exercise.name}
              muscleGroup={exercise.muscle_group}
              size="h-10 w-10"
              artSize="h-8 w-8"
              tone={done ? 'text-green-700' : 'text-gray-500'}
              tileBg={done ? 'bg-green-100' : 'bg-gray-100'}
            />
            {done && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-600">
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-900">{exercise.name}</p>
            {!done && (
              <p className="mt-0.5 truncate text-sm text-gray-400">
                {last
                  ? `Last time: ${Number(last.weight_kg)} kg × ${last.reps} × ${last.sets}`
                  : 'Not logged yet'}
              </p>
            )}
          </div>
          {done && (
            <p className="shrink-0 text-right text-sm font-semibold tabular-nums text-gray-900">
              {exVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg
              {calInputs && (
                <span className="ml-1.5 font-normal text-gray-400">
                  ≈{Math.round(sumCalories(setLogs, calInputs))} kcal
                </span>
              )}
            </p>
          )}
        </div>

        {/* Sets are indented to clear the 40px tile + gutter, lining up under the name. */}
        {done && (
          <ul className="pl-[4.25rem] pr-4">
            {setLogs.map((log, i) => (
              <li key={log.id}>
                <button
                  onClick={() => setActive({ exercise, existing: log })}
                  className="flex w-full items-center gap-2 rounded-lg py-1.5 text-left active:bg-gray-50"
                >
                  <span className="w-11 shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Set {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-green-700">
                    {Number(log.weight_kg)} kg × {log.reps}
                    {log.sets > 1 ? ` × ${log.sets}` : ''}
                    {log.rpe !== null && ` · RPE ${Number(log.rpe)}`}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => setActive({ exercise, existing: null, prefill })}
          className="flex w-full items-center gap-2 px-4 pb-3 pt-1.5 text-sm font-semibold text-brand-600 active:bg-gray-50"
        >
          <Plus className="h-4 w-4" strokeWidth={2.6} />
          {done ? 'Add set' : 'Log set'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <SubHeader title={day.name} />

      <div className="px-5 py-4">
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Date</p>
              <p className="mt-0.5 text-lg font-bold text-gray-900">{formatLogDate(date)}</p>
            </div>
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="rounded-xl border border-gray-300 bg-surface px-3 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          {date !== todayISO() && (
            <button
              onClick={() => setDate(todayISO())}
              className="mt-3 w-full rounded-lg bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 active:bg-gray-200"
            >
              Back to today
            </button>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between px-1">
          <p className="text-sm font-medium text-gray-600">
            {doneCount} of {planExercises.length} done
          </p>
          {doneCount > 0 && (
            <p className="text-sm font-semibold text-gray-900">
              {logs
                .reduce((sum, l) => sum + Number(l.volume), 0)
                .toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
              kg total
              {calInputs && (
                <span className="font-normal text-gray-400">
                  {' · '}≈{Math.round(sumCalories(logs, calInputs)).toLocaleString()} kcal
                </span>
              )}
            </p>
          )}
        </div>

        <div className="mt-2 overflow-hidden rounded-2xl bg-surface shadow-sm">
          {planExercises.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-gray-400">
              This day has no exercises yet.
            </p>
          ) : (
            planExercises.map(renderRow)
          )}
        </div>

        {extras.length > 0 && (
          <>
            <p className="mb-2 mt-6 px-1 text-sm font-medium text-gray-600">
              Extra, not in the plan
            </p>
            <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
              {extras.map(renderRow)}
            </div>
          </>
        )}

        <button
          onClick={() => setPickerOpen(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-surface py-4 font-semibold text-gray-700 active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.6} />
          Log another exercise
        </button>

        <div className="mt-4">
          <RestTimerLauncher />
        </div>
      </div>

      <LogEntrySheet
        open={active !== null}
        exerciseName={active?.exercise.name ?? ''}
        muscleGroup={active?.exercise.muscle_group}
        lastEntry={active ? (active.prefill ?? lastEntries[active.exercise.id]) : null}
        existing={active?.existing}
        onClose={() => setActive(null)}
        onSave={handleSave}
        onDelete={
          active?.existing
            ? async () => {
                await deleteLog(active.existing!.id)
                await Promise.all([loadLogs(), loadDay()])
              }
            : undefined
        }
      />

      <ExercisePicker
        open={pickerOpen}
        library={library}
        alreadyAdded={[...planExercises, ...extras].map((e) => e.id)}
        onClose={() => setPickerOpen(false)}
        onAdd={async (ids) => {
          const chosen = library.find((e) => e.id === ids[0])
          setPickerOpen(false)
          if (chosen) setActive({ exercise: chosen, existing: null })
        }}
        onCreateCustom={async (name, muscleGroup) => {
          if (!session) throw new Error('Not signed in')
          const created = await createCustomExercise(session.user.id, name, muscleGroup)
          setLibrary((prev) => [...prev, created])
          return created
        }}
      />

      <PRCelebration win={celebration} onClose={() => setCelebration(null)} />
    </div>
  )
}
