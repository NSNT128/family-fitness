import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Dumbbell, Loader2, TrendingUp } from 'lucide-react'
import SubHeader from '../components/SubHeader'
import ProgressChart from '../components/ProgressChart'
import { fetchExerciseHistory, progressStats, type ProgressPoint } from '../lib/progress'
import { formatLogDate } from '../lib/logs'

type Metric = 'weight_kg' | 'volume'

export default function ExerciseProgressPage() {
  const { name: rawName } = useParams<{ name: string }>()
  const name = decodeURIComponent(rawName ?? '')
  const [points, setPoints] = useState<ProgressPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [metric, setMetric] = useState<Metric>('weight_kg')

  useEffect(() => {
    let cancelled = false
    fetchExerciseHistory(name)
      .then((p) => !cancelled && setPoints(p))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [name])

  const stats = useMemo(() => progressStats(points), [points])
  const recent = useMemo(() => [...points].reverse().slice(0, 12), [points])
  const change = stats ? stats.latestWeight - stats.firstWeight : 0

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  return (
    <div>
      <SubHeader title={name} />

      <div className="space-y-4 px-5 py-4">
        {points.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-surface px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
              <Dumbbell className="h-7 w-7 text-brand-600" />
            </div>
            <p className="font-semibold text-gray-900">No history yet</p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Log this exercise and your progress will chart here.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Best weight', value: `${stats!.bestWeight.toFixed(1)}`, unit: 'kg' },
                { label: 'Best volume', value: Math.round(stats!.bestVolume).toLocaleString(), unit: 'kg' },
                { label: 'Sessions', value: `${stats!.sessions}`, unit: '' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-surface p-3 text-center shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {s.label}
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">{s.value}</p>
                  {s.unit && <p className="text-xs text-gray-400">{s.unit}</p>}
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-surface p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-600" />
                  <p className="text-sm font-medium text-gray-600">Over time</p>
                </div>
                <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs font-semibold">
                  {(
                    [
                      ['weight_kg', 'Weight'],
                      ['volume', 'Volume'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setMetric(key)}
                      className={`rounded-md px-3 py-1.5 transition ${
                        metric === key ? 'bg-surface text-brand-600 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {points.length === 1 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  Log it again to see a trend line.
                </p>
              ) : (
                <ProgressChart points={points} metric={metric} />
              )}

              {metric === 'weight_kg' && Math.abs(change) >= 0.1 && (
                <p className="mt-1 text-center text-xs text-gray-400">
                  {change > 0 ? '+' : ''}
                  {change.toFixed(1)} kg since your first session
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 px-1 text-sm font-medium text-gray-600">Recent sessions</p>
              <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
                {recent.map((p, i) => (
                  <div
                    key={`${p.logged_on}-${i}`}
                    className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 first:border-t-0"
                  >
                    <p className="text-sm font-medium text-gray-500">{formatLogDate(p.logged_on)}</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {p.weight_kg} kg × {p.reps} × {p.sets}
                      <span className="ml-2 font-normal text-gray-400">
                        {Math.round(p.volume).toLocaleString()} kg
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
