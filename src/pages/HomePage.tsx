import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, Flame, Loader2, TrendingDown, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'
import NextUpCard from '../components/NextUpCard'
import WeeklyTrendChart from '../components/WeeklyTrendChart'
import {
  calculateWeekStats,
  calculateWeeklyStreak,
  fetchActiveSplit,
  fetchAllLogs,
  nextWorkoutDay,
  todayISO,
  trainingTimeStats,
  weeklyTrend,
} from '../lib/logs'
import { caloriesForLog, calorieInputs } from '../lib/calories'
import { cardioCalories, fetchCardio, formatDuration, type CardioLog } from '../lib/cardio'
import type { Profile, Split, WorkoutLog } from '../lib/types'

type Metric = 'volume' | 'calories' | 'cardio'

export default function HomePage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [split, setSplit] = useState<Split | null>(null)
  const [latestWeight, setLatestWeight] = useState<number | null>(null)
  const [cardio, setCardio] = useState<CardioLog[]>([])
  const [loading, setLoading] = useState(true)
  const [metric, setMetric] = useState<Metric>('volume')

  useEffect(() => {
    if (!session) return
    const load = async () => {
      try {
        const [{ data: prof }, allLogs, activeSplit, { data: weight }, cardioLogs] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', session.user.id).single(),
          fetchAllLogs(),
          fetchActiveSplit().catch(() => null),
          supabase
            .from('body_weights')
            .select('weight_kg')
            .order('logged_on', { ascending: false })
            .limit(1)
            .maybeSingle(),
          // Degrades to an empty list until phase9.sql has been run.
          fetchCardio().catch(() => [] as CardioLog[]),
        ])
        setProfile(prof)
        setLogs(allLogs)
        setSplit(activeSplit)
        setLatestWeight(weight ? Number(weight.weight_kg) : null)
        setCardio(cardioLogs)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [session])

  const streak = useMemo(() => calculateWeeklyStreak(logs), [logs])
  const week = useMemo(() => calculateWeekStats(logs), [logs])
  const nextDay = useMemo(() => nextWorkoutDay(split, logs), [split, logs])
  const trainedToday = useMemo(() => logs.some((l) => l.logged_on === todayISO()), [logs])

  const timeStats = useMemo(() => trainingTimeStats(logs), [logs])
  const calInputs = useMemo(() => calorieInputs(profile, latestWeight), [profile, latestWeight])
  const volumeTrend = useMemo(() => weeklyTrend(logs, (l) => Number(l.volume)), [logs])
  const cardioTrend = useMemo(
    () => weeklyTrend(cardio, (c) => Number(c.minutes)),
    [cardio],
  )
  // Calories are the whole week's burn, so lifting and cardio are added together.
  const calorieTrend = useMemo(() => {
    if (!calInputs) return null
    const lifting = weeklyTrend(logs, (l) => caloriesForLog(l, calInputs))
    const cardioKcal = weeklyTrend(cardio, (c) => cardioCalories(c, calInputs))
    return lifting.map((w, i) => ({ ...w, value: w.value + (cardioKcal[i]?.value ?? 0) }))
  }, [logs, cardio, calInputs])

  const hasCardio = cardio.length > 0
  const activeMetric: Metric =
    metric === 'calories' && !calorieTrend ? 'volume' : metric === 'cardio' && !hasCardio ? 'volume' : metric
  const trend =
    activeMetric === 'calories' ? calorieTrend! : activeMetric === 'cardio' ? cardioTrend : volumeTrend
  const unit = activeMetric === 'calories' ? 'kcal' : activeMetric === 'cardio' ? 'min' : 'kg'
  const showCalories = activeMetric === 'calories'

  const thisWeekVal = trend.length ? trend[trend.length - 1].value : 0
  const lastWeekVal = trend.length > 1 ? trend[trend.length - 2].value : 0
  const delta = thisWeekVal - lastWeekVal
  const hasTrend = trend.some((w) => w.value > 0)
  const hasAnyLogs = logs.length > 0

  const goal = profile?.weekly_workout_goal ?? 4
  const done = week.sessionCount
  const goalPct = Math.min(100, goal > 0 ? (done / goal) * 100 : 0)
  const goalMet = done >= goal

  const greeting = profile?.name ? `Hi, ${profile.name}!` : 'Hi!'

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={greeting} subtitle="Keep crushing it." />

      <div className="space-y-4 px-5 py-4">
        <NextUpCard day={nextDay} trainedToday={trainedToday} hasActiveSplit={split !== null} />

        {/* Weekly workout goal */}
        <div className="rounded-2xl bg-surface p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">This week</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tabular-nums text-gray-900">{done}</span>
                <span className="text-lg font-medium text-gray-400">/ {goal} workouts</span>
              </div>
            </div>
            {streak > 0 && (
              <div className="flex shrink-0 items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1.5 text-sm font-semibold text-orange-500">
                <Flame className="h-4 w-4" />
                {streak} wk
              </div>
            )}
          </div>

          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${goalMet ? 'bg-green-500' : 'bg-brand-600'}`}
              style={{ width: `${goalPct}%` }}
            />
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-gray-500">
            {goalMet ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Weekly goal reached — nice work!
              </>
            ) : (
              `${goal - done} more to hit your goal`
            )}
          </p>
        </div>

        {/* Weekly trend: volume / calories */}
        {hasTrend ? (
          <div className="rounded-2xl bg-surface p-5 shadow-sm">
            <div className="mb-1 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Weekly {activeMetric === 'calories' ? 'calories' : activeMetric === 'cardio' ? 'cardio' : 'volume'}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {activeMetric === 'cardio'
                      ? formatDuration(thisWeekVal)
                      : Math.round(thisWeekVal).toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-gray-400">
                    {activeMetric === 'calories'
                      ? '≈ kcal this week'
                      : activeMetric === 'cardio'
                        ? 'this week'
                        : 'kg this week'}
                  </span>
                </div>
              </div>
              {lastWeekVal > 0 && Math.abs(delta) >= 1 && (
                <div
                  className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold ${
                    delta >= 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {delta >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {delta >= 0 ? '+' : ''}
                  {Math.round((delta / lastWeekVal) * 100)}%
                </div>
              )}
            </div>

            {(calorieTrend || hasCardio) && (
              <div className="mb-3 mt-2 flex rounded-lg bg-gray-100 p-0.5 text-xs font-semibold">
                {(
                  [
                    ['volume', 'Volume', true],
                    ['calories', 'Calories', Boolean(calorieTrend)],
                    ['cardio', 'Cardio', hasCardio],
                  ] as const
                )
                  .filter(([, , enabled]) => enabled)
                  .map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setMetric(key)}
                      className={`flex-1 rounded-md py-1.5 transition ${
                        activeMetric === key ? 'bg-surface text-brand-600 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
              </div>
            )}

            <WeeklyTrendChart data={trend} unit={unit} />
            <p className="mt-1 text-center text-xs text-gray-400">
              Last 8 weeks · this week highlighted{showCalories && ' · estimated'}
            </p>
          </div>
        ) : (
          hasAnyLogs && (
            <div className="rounded-2xl bg-surface p-5 text-center shadow-sm">
              <p className="text-sm text-gray-500">
                Keep logging to see your weekly trend build up here.
              </p>
            </div>
          )
        )}

        {timeStats && timeStats.sessions >= 2 && (
          <div className="rounded-2xl bg-surface p-5 shadow-sm">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
              <Clock className="h-3.5 w-3.5" /> When you train
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-gray-900">
                {timeStats.label}
              </span>
              <span className="text-sm font-medium text-gray-400">on average</span>
            </div>

            {/* Sessions per hour — the shape says more than the average alone. */}
            <div className="mt-3 flex h-12 items-end gap-px">
              {timeStats.byHour.map((count, hour) => {
                const peak = Math.max(...timeStats.byHour)
                return (
                  <div
                    key={hour}
                    title={`${String(hour).padStart(2, '0')}:00 — ${count} session${count === 1 ? '' : 's'}`}
                    className={`flex-1 rounded-sm ${count > 0 ? 'bg-brand-500' : 'bg-gray-100'}`}
                    style={{ height: count > 0 ? `${Math.max(18, (count / peak) * 100)}%` : '4px' }}
                  />
                )
              })}
            </div>
            <div className="mt-1 flex justify-between text-[10px] font-medium text-gray-400">
              <span>00</span>
              <span>06</span>
              <span>12</span>
              <span>18</span>
              <span>23</span>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Earliest {timeStats.earliest} · latest {timeStats.latest} · {timeStats.sessions}{' '}
              session{timeStats.sessions === 1 ? '' : 's'}
            </p>
          </div>
        )}

        {!calInputs && hasAnyLogs && (
          <button
            onClick={() => navigate('/profile/edit')}
            className="w-full rounded-2xl border border-dashed border-gray-300 bg-surface px-4 py-3 text-sm font-medium text-gray-500 active:bg-gray-50"
          >
            Add your age &amp; weight in Profile to unlock calorie estimates →
          </button>
        )}
      </div>
    </div>
  )
}
