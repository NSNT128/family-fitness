import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Plus, Scale, Target, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'
import Sheet from '../components/Sheet'
import Stepper from '../components/Stepper'
import ConfirmDialog from '../components/ConfirmDialog'
import WeightChart from '../components/WeightChart'
import { formatLogDate, todayISO } from '../lib/logs'
import { PERIODS, changeOver, deleteWeight, fetchWeights, saveWeight } from '../lib/weights'
import type { BodyWeight, PeriodKey } from '../lib/weights'
import type { Profile } from '../lib/types'

export default function WeightPage() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [entries, setEntries] = useState<BodyWeight[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [adding, setAdding] = useState(false)
  const [draftWeight, setDraftWeight] = useState(75)
  const [draftDate, setDraftDate] = useState(todayISO())
  const [busy, setBusy] = useState(false)
  const [period, setPeriod] = useState<PeriodKey>('week')
  const [confirmDelete, setConfirmDelete] = useState<BodyWeight | null>(null)

  const load = useCallback(async () => {
    if (!session) return
    try {
      const [weights, { data }] = await Promise.all([
        fetchWeights(),
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      ])
      setEntries(weights)
      setProfile(data)
    } catch {
      setError('Could not load your weight history.')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    load()
  }, [load])

  const latest = entries.length ? entries[entries.length - 1] : null
  const goal = profile?.goal_weight_kg != null ? Number(profile.goal_weight_kg) : null
  const start = profile?.starting_weight_kg != null ? Number(profile.starting_weight_kg) : null

  const change = useMemo(
    () => changeOver(entries, PERIODS.find((p) => p.key === period)!.days),
    [entries, period],
  )

  const openAdd = () => {
    const today = todayISO()
    const existingToday = entries.find((e) => e.logged_on === today)
    setDraftWeight(existingToday?.weight_kg ?? latest?.weight_kg ?? start ?? 75)
    setDraftDate(today)
    setError('')
    setAdding(true)
  }

  const save = async () => {
    if (!session) return
    setBusy(true)
    try {
      await saveWeight(session.user.id, draftDate, draftWeight)
      setAdding(false)
      await load()
    } catch {
      setError('Could not save that weigh-in.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  const toGo = goal !== null && latest ? latest.weight_kg - goal : null
  const losing = start !== null && goal !== null ? goal < start : true

  return (
    <div>
      <PageHeader title="Bodyweight" />

      <div className="px-5 py-2">
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {latest ? (
          <div className="rounded-2xl bg-surface p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Current weight
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900">
                {latest.weight_kg.toFixed(1)}
              </span>
              <span className="text-lg font-medium text-gray-400">kg</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{formatLogDate(latest.logged_on)}</p>

            {toGo !== null && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 shrink-0 text-brand-600" />
                  <p className="text-sm font-semibold text-gray-900">
                    {Math.abs(toGo) < 0.05
                      ? "You're at your goal weight"
                      : `${Math.abs(toGo).toFixed(1)} kg to go`}
                    <span className="font-normal text-gray-500"> · goal {goal!.toFixed(1)} kg</span>
                  </p>
                </div>
                {start !== null && Math.abs(start - goal!) > 0.05 && (
                  <>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-brand-600 transition-all"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              ((start - latest.weight_kg) / (start - goal!)) * 100,
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      Started at {start.toFixed(1)} kg
                    </p>
                  </>
                )}
              </div>
            )}

            {goal === null && (
              <button
                onClick={() => navigate('/profile/edit')}
                className="mt-4 w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 active:bg-gray-200"
              >
                Set a goal weight
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-surface px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
              <Scale className="h-7 w-7 text-brand-600" />
            </div>
            <p className="font-semibold text-gray-900">No weigh-ins yet</p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Add your weight and it'll be graphed here over time.
            </p>
          </div>
        )}

        <button
          onClick={openAdd}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.6} />
          Add weigh-in
        </button>

        {change && (
          <div className="mt-4 rounded-2xl bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-600">Change</p>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodKey)}
                className="rounded-xl border border-gray-300 bg-surface px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              >
                {PERIODS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex items-center gap-2">
              {change.delta < 0 ? (
                <TrendingDown
                  className={`h-6 w-6 shrink-0 ${losing ? 'text-green-600' : 'text-gray-400'}`}
                />
              ) : (
                <TrendingUp
                  className={`h-6 w-6 shrink-0 ${losing ? 'text-gray-400' : 'text-green-600'}`}
                />
              )}
              <span className="text-2xl font-bold text-gray-900">
                {change.delta > 0 ? '+' : ''}
                {change.delta.toFixed(1)} kg
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {change.exact
                ? `over the last ${change.spanDays} day${change.spanDays === 1 ? '' : 's'}`
                : `since ${formatLogDate(change.fromDate)} — your earliest weigh-in (${change.spanDays} day${
                    change.spanDays === 1 ? '' : 's'
                  })`}
            </p>
          </div>
        )}

        {entries.length >= 2 && (
          <div className="mt-4 rounded-2xl bg-surface p-4 shadow-sm">
            <h2 className="mb-1 px-1 text-sm font-medium text-gray-600">Bodyweight over time</h2>
            <WeightChart entries={entries} goalWeight={goal} />
          </div>
        )}

        {entries.length > 0 && (
          <section className="mt-4">
            <h2 className="mb-2 px-1 text-sm font-medium text-gray-600">
              All weigh-ins ({entries.length})
            </h2>
            <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
              {[...entries].reverse().map((entry, i) => {
                const previous = entries[entries.length - 2 - i]
                const diff = previous ? entry.weight_kg - previous.weight_kg : null
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 px-4 py-3.5 ${
                      i > 0 ? 'border-t border-gray-100' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{formatLogDate(entry.logged_on)}</p>
                      {diff !== null && Math.abs(diff) >= 0.05 && (
                        <p
                          className={`text-xs font-medium ${
                            diff < 0 === losing ? 'text-green-600' : 'text-gray-400'
                          }`}
                        >
                          {diff > 0 ? '+' : ''}
                          {diff.toFixed(1)} kg
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 font-bold tabular-nums text-gray-900">
                      {entry.weight_kg.toFixed(1)} kg
                    </span>
                    <button
                      onClick={() => setConfirmDelete(entry)}
                      aria-label={`Delete weigh-in for ${entry.logged_on}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 active:bg-red-50 active:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      <Sheet open={adding} title="Add weigh-in" onClose={() => setAdding(false)}>
        <div className="px-5 py-5">
          <div className="mb-5 rounded-2xl bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Date</p>
                <p className="mt-0.5 text-lg font-bold text-gray-900">{formatLogDate(draftDate)}</p>
              </div>
              <input
                type="date"
                value={draftDate}
                max={todayISO()}
                onChange={(e) => e.target.value && setDraftDate(e.target.value)}
                className="rounded-xl border border-gray-300 bg-surface px-3 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>

          <Stepper
            label="Weight"
            value={draftWeight}
            onChange={setDraftWeight}
            step={0.1}
            min={20}
            max={400}
            unit="kg"
            decimals={1}
          />

          {entries.some((e) => e.logged_on === draftDate) && (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              You already weighed in on this date — saving will update it.
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-gray-200 bg-surface px-5 py-3">
          <button
            onClick={save}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 text-base font-semibold text-white active:scale-[0.98] disabled:opacity-60"
          >
            {busy && <Loader2 className="h-5 w-5 animate-spin" />}
            Save
          </button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this weigh-in?"
        message={`Your entry for ${
          confirmDelete ? formatLogDate(confirmDelete.logged_on) : ''
        } will be removed.`}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          const entry = confirmDelete
          setConfirmDelete(null)
          if (!entry) return
          try {
            await deleteWeight(entry.id)
            await load()
          } catch {
            setError('Could not delete that weigh-in.')
          }
        }}
      />
    </div>
  )
}
