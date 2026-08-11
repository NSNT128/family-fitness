import { useCallback, useEffect, useMemo, useState } from 'react'
import { Flame, Gauge, Loader2, MapPin, Plus, Timer, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import SubHeader from '../components/SubHeader'
import Sheet from '../components/Sheet'
import Stepper from '../components/Stepper'
import { calorieInputs, type CalorieInputs } from '../lib/calories'
import {
  MACHINES,
  cardioCalories,
  cardioTotals,
  createCardio,
  deleteCardio,
  fetchCardio,
  formatDuration,
  formatPace,
  updateCardio,
  type CardioLog,
} from '../lib/cardio'
import { formatLogDate, todayISO } from '../lib/logs'

export default function CardioPage() {
  const { session } = useAuth()
  const [logs, setLogs] = useState<CardioLog[]>([])
  const [calInputs, setCalInputs] = useState<CalorieInputs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState<CardioLog | null>(null)
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(todayISO())
  const [machine, setMachine] = useState('Treadmill')
  const [speed, setSpeed] = useState(8)
  const [incline, setIncline] = useState(1)
  const [minutes, setMinutes] = useState(30)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setLogs(await fetchCardio())
    } catch {
      setError('Could not load your cardio. Has phase9.sql been run?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

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

  const startNew = () => {
    setEditing(null)
    setDate(todayISO())
    const last = logs[0]
    setMachine(last?.machine ?? 'Treadmill')
    setSpeed(last ? Number(last.speed_kmh) : 8)
    setIncline(last ? Number(last.incline_pct) : 1)
    setMinutes(last ? Number(last.minutes) : 30)
    setOpen(true)
  }

  const startEdit = (log: CardioLog) => {
    setEditing(log)
    setDate(log.logged_on)
    setMachine(log.machine)
    setSpeed(Number(log.speed_kmh))
    setIncline(Number(log.incline_pct))
    setMinutes(Number(log.minutes))
    setOpen(true)
  }

  const save = async () => {
    if (!session) return
    setBusy(true)
    setError('')
    try {
      const values = {
        logged_on: date,
        machine,
        speed_kmh: speed,
        incline_pct: incline,
        minutes,
        notes: null,
      }
      if (editing) await updateCardio(editing.id, values)
      else await createCardio(session.user.id, values)
      setOpen(false)
      await load()
    } catch {
      setError('Could not save that session.')
    } finally {
      setBusy(false)
    }
  }

  const totals = useMemo(() => cardioTotals(logs), [logs])
  const totalCalories = useMemo(
    () => (calInputs ? logs.reduce((s, l) => s + cardioCalories(l, calInputs), 0) : 0),
    [logs, calInputs],
  )

  // Live preview inside the form — the numbers are the point of logging cardio.
  const preview = useMemo(() => {
    const distance = (speed * minutes) / 60
    return {
      distance,
      pace: speed > 0 ? 60 / speed : 0,
      calories: calInputs
        ? cardioCalories({ speed_kmh: speed, incline_pct: incline, minutes }, calInputs)
        : null,
    }
  }, [speed, incline, minutes, calInputs])

  const grouped = useMemo(() => {
    const map = new Map<string, CardioLog[]>()
    for (const l of logs) {
      const list = map.get(l.logged_on) ?? []
      list.push(l)
      map.set(l.logged_on, list)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [logs])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  return (
    <div>
      <SubHeader title="Cardio" />

      <div className="px-5 py-4">
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {logs.length > 0 && (
          <>
          <p className="mb-2 px-1 text-sm font-medium text-gray-600">
            All time · {totals.sessions} day{totals.sessions === 1 ? '' : 's'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
                <Timer className="h-3.5 w-3.5" /> Total time
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatDuration(totals.minutes)}
              </p>
            </div>
            <div className="rounded-2xl bg-surface p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
                <MapPin className="h-3.5 w-3.5" /> Distance
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {totals.distanceKm.toFixed(1)} km
              </p>
            </div>
            <div className="rounded-2xl bg-surface p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
                <Gauge className="h-3.5 w-3.5" /> Avg speed
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {totals.avgSpeedKmh.toFixed(1)} km/h
              </p>
              <p className="text-xs text-gray-400">{formatPace(totals.avgPaceMinPerKm)}</p>
            </div>
            <div className="rounded-2xl bg-surface p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
                <Flame className="h-3.5 w-3.5" /> Calories
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {calInputs ? `≈${Math.round(totalCalories).toLocaleString()}` : '—'}
              </p>
              {!calInputs && <p className="text-xs text-gray-400">Add age in Profile</p>}
            </div>
          </div>
          </>
        )}

        <button
          onClick={startNew}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 font-semibold text-white shadow-lg shadow-brand-600/25 active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.6} />
          Log cardio
        </button>

        {grouped.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-surface px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
              <Timer className="h-7 w-7 text-brand-600" />
            </div>
            <p className="font-semibold text-gray-900">No cardio yet</p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Log a run, ride or walk and it'll work out your distance, pace and calories.
            </p>
          </div>
        ) : (
          grouped.map(([day, entries]) => {
            const t = cardioTotals(entries)
            return (
              <section key={day} className="mt-5">
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h2 className="text-sm font-bold text-gray-900">{formatLogDate(day)}</h2>
                  <p className="text-xs font-medium text-gray-500">
                    {formatDuration(t.minutes)} · {t.distanceKm.toFixed(1)} km
                    {calInputs &&
                      ` · ≈${Math.round(
                        entries.reduce((s, l) => s + cardioCalories(l, calInputs), 0),
                      )} kcal`}
                  </p>
                </div>
                <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
                  {entries.map((log, i) => (
                    <button
                      key={log.id}
                      onClick={() => startEdit(log)}
                      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 ${
                        i > 0 ? 'border-t border-gray-100' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-gray-900">{log.machine}</p>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {Number(log.speed_kmh)} km/h · {Number(log.incline_pct)}% ·{' '}
                          {formatDuration(Number(log.minutes))}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold tabular-nums text-gray-900">
                          {Number(log.distance_km).toFixed(2)} km
                        </p>
                        {calInputs && (
                          <p className="text-xs text-gray-400">
                            ≈{Math.round(cardioCalories(log, calInputs))} kcal
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )
          })
        )}
      </div>

      <Sheet
        open={open}
        title={editing ? 'Edit cardio' : 'Log cardio'}
        onClose={() => setOpen(false)}
      >
        <div className="px-5 py-4">
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-surface p-4 shadow-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Date</p>
              <p className="mt-0.5 font-bold text-gray-900">{formatLogDate(date)}</p>
            </div>
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="rounded-xl border border-gray-300 bg-surface px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <p className="mb-2 text-sm font-medium text-gray-600">Machine</p>
          <div className="mb-5 flex flex-wrap gap-2">
            {MACHINES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMachine(m)}
                className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                  machine === m ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <Stepper
              label="Speed"
              value={speed}
              onChange={setSpeed}
              step={0.5}
              min={0}
              max={40}
              unit="km/h"
              decimals={1}
            />
            <Stepper
              label="Incline"
              value={incline}
              onChange={setIncline}
              step={0.5}
              min={0}
              max={30}
              unit="%"
              decimals={1}
            />
            <Stepper
              label="Time"
              value={minutes}
              onChange={setMinutes}
              step={1}
              min={1}
              max={300}
              unit="min"
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-panel px-4 py-4 text-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Distance</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-white">
                {preview.distance.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">km</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Pace</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-white">
                {formatPace(preview.pace).replace(' /km', '')}
              </p>
              <p className="text-xs text-gray-500">/km</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Calories</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-white">
                {preview.calories === null ? '—' : `≈${Math.round(preview.calories)}`}
              </p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
          </div>
          {preview.calories === null && (
            <p className="mt-2 text-center text-xs text-gray-400">
              Add your age in Profile to estimate calories.
            </p>
          )}

          {editing && (
            <button
              type="button"
              onClick={async () => {
                setBusy(true)
                try {
                  await deleteCardio(editing.id)
                  setOpen(false)
                  await load()
                } catch {
                  setError('Could not delete that session.')
                } finally {
                  setBusy(false)
                }
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-surface py-3.5 font-semibold text-red-600 active:scale-[0.98]"
            >
              <Trash2 className="h-5 w-5" />
              Delete this session
            </button>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-gray-200 bg-surface px-5 py-3">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 text-base font-semibold text-white active:scale-[0.98] disabled:opacity-60"
          >
            {busy && <Loader2 className="h-5 w-5 animate-spin" />}
            {editing ? 'Save changes' : 'Save'}
          </button>
        </div>
      </Sheet>
    </div>
  )
}
