import { supabase } from './supabase'
import type { Split, SplitDay, WorkoutLog } from './types'

/**
 * Today in the user's own timezone. Deliberately not toISOString(), which is
 * UTC and would file a 11pm workout under tomorrow's date for anyone east of
 * Greenwich — or yesterday's, west of it.
 */
export const todayISO = (): string => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export const formatLogDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - date.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  })
}

export interface LogInput {
  logged_on: string
  day_name: string | null
  exercise_id: string | null
  exercise_name: string
  weight_kg: number
  reps: number
  sets: number
  rpe: number | null
  notes: string | null
}

export async function fetchActiveSplit(): Promise<Split | null> {
  const { data, error } = await supabase
    .from('splits')
    .select(
      'id, name, is_active, split_days(id, split_id, name, position, ' +
        'split_day_exercises(id, day_id, exercise_id, position, exercises(*)))',
    )
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const split = data as unknown as Split
  return {
    ...split,
    split_days: [...(split.split_days ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((day) => ({
        ...day,
        split_day_exercises: [...(day.split_day_exercises ?? [])].sort(
          (a, b) => a.position - b.position,
        ),
      })),
  }
}

export async function fetchLogsOn(date: string): Promise<WorkoutLog[]> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('logged_on', date)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as WorkoutLog[]
}

/**
 * The most recent entry for each of these exercises, so the logging form can
 * open pre-filled with what you lifted last time instead of at zero.
 */
export async function fetchLastEntries(
  exerciseIds: string[],
): Promise<Record<string, WorkoutLog>> {
  if (exerciseIds.length === 0) return {}
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .in('exercise_id', exerciseIds)
    .order('logged_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(400)
  if (error) throw error

  const latest: Record<string, WorkoutLog> = {}
  for (const log of (data ?? []) as WorkoutLog[]) {
    if (log.exercise_id && !latest[log.exercise_id]) latest[log.exercise_id] = log
  }
  return latest
}

export async function fetchAllLogs(): Promise<WorkoutLog[]> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .order('logged_on', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as WorkoutLog[]
}

export async function createLog(userId: string, input: LogInput) {
  const { error } = await supabase.from('workout_logs').insert({ user_id: userId, ...input })
  if (error) throw error
}

export async function updateLog(id: string, input: Partial<LogInput>) {
  const { error } = await supabase.from('workout_logs').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteLog(id: string) {
  const { error } = await supabase.from('workout_logs').delete().eq('id', id)
  if (error) throw error
}

export interface SessionGroup {
  date: string
  dayNames: string[]
  logs: WorkoutLog[]
  totalVolume: number
}

export function groupByDate(logs: WorkoutLog[]): SessionGroup[] {
  const map = new Map<string, WorkoutLog[]>()
  for (const log of logs) {
    const list = map.get(log.logged_on) ?? []
    list.push(log)
    map.set(log.logged_on, list)
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, entries]) => ({
      date,
      dayNames: [...new Set(entries.map((e) => e.day_name).filter((n): n is string => !!n))],
      logs: entries,
      totalVolume: entries.reduce((sum, e) => sum + Number(e.volume), 0),
    }))
}

// ── Local-calendar date helpers ────────────────────────────────────────────
// All date math stays in the user's own timezone. new Date(iso) would parse a
// bare YYYY-MM-DD as UTC midnight and drift a day for anyone not on UTC, so we
// parse and format by local Y/M/D explicitly.

const toLocalISO = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const parseLocal = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const addDaysISO = (iso: string, n: number): string => {
  const d = parseLocal(iso)
  d.setDate(d.getDate() + n)
  return toLocalISO(d)
}

/** The Monday (ISO date) of the week containing `iso`. Weeks run Mon–Sun. */
const mondayOfISO = (iso: string): string => {
  const d = parseLocal(iso)
  const offset = d.getDay() === 0 ? 6 : d.getDay() - 1
  return addDaysISO(iso, -offset)
}

/**
 * How many weeks in a row you've trained, counting back from this week.
 *
 * Deliberately NOT a daily streak: strength programs schedule rest days, so a
 * consecutive-calendar-day streak would punish training correctly and reset the
 * moment someone takes a needed rest day. A week counts if it holds at least one
 * session. The current week not being trained *yet* doesn't break the streak —
 * we only stop once a fully-elapsed past week is empty — so a fresh Monday never
 * wipes out weeks of consistency.
 */
export function calculateWeeklyStreak(logs: WorkoutLog[]): number {
  if (logs.length === 0) return 0
  const weeks = new Set(logs.map((log) => mondayOfISO(log.logged_on)))
  const thisMonday = mondayOfISO(todayISO())
  const lastMonday = addDaysISO(thisMonday, -7)

  let cursor: string
  if (weeks.has(thisMonday)) cursor = thisMonday
  else if (weeks.has(lastMonday)) cursor = lastMonday
  else return 0

  let streak = 0
  while (weeks.has(cursor)) {
    streak++
    cursor = addDaysISO(cursor, -7)
  }
  return streak
}

export interface WeekStats {
  totalVolume: number
  sessionCount: number
}

/** This week's (Mon–Sun) volume and number of distinct training days. */
export function calculateWeekStats(logs: WorkoutLog[]): WeekStats {
  const weekStart = mondayOfISO(todayISO())
  const weekEnd = addDaysISO(weekStart, 6)
  const thisWeekLogs = logs.filter(
    (log) => log.logged_on >= weekStart && log.logged_on <= weekEnd,
  )
  return {
    totalVolume: thisWeekLogs.reduce((sum, log) => sum + Number(log.volume), 0),
    sessionCount: new Set(thisWeekLogs.map((log) => log.logged_on)).size,
  }
}

export interface WeekPoint {
  weekStart: string
  label: string
  value: number
  isCurrent: boolean
}

/**
 * Per-week totals for the last `weeks` weeks, oldest → newest (for charting).
 * `valueOf` maps a log to whatever is being summed — volume, estimated calories, etc.
 */
export function weeklyTrend<T extends { logged_on: string }>(
  logs: T[],
  valueOf: (log: T) => number,
  weeks = 8,
): WeekPoint[] {
  const thisMonday = mondayOfISO(todayISO())
  const buckets: WeekPoint[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const start = addDaysISO(thisMonday, -7 * i)
    const end = addDaysISO(start, 6)
    const value = logs
      .filter((log) => log.logged_on >= start && log.logged_on <= end)
      .reduce((sum, log) => sum + valueOf(log), 0)
    buckets.push({
      weekStart: start,
      label: parseLocal(start).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      value,
      isCurrent: i === 0,
    })
  }
  return buckets
}

export interface TrainingTimeStats {
  /** Minutes past midnight, averaged across sessions. */
  averageMinutes: number
  label: string
  earliest: string
  latest: string
  /** Sessions per hour-of-day, 0–23, for a simple distribution. */
  byHour: number[]
  sessions: number
}

const clockLabel = (minutes: number): string => {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/**
 * When you actually train, taken from the first set logged in each session.
 *
 * Back-dated entries are skipped: if a workout was typed in days later, its
 * created_at says when it was typed, not when it happened, and averaging that in
 * would quietly drag the number toward whenever you catch up on admin. Only
 * sessions logged on the day they happened are counted.
 */
export function trainingTimeStats(logs: WorkoutLog[]): TrainingTimeStats | null {
  const firstPerSession = new Map<string, Date>()
  for (const log of logs) {
    if (!log.created_at) continue
    const created = new Date(log.created_at)
    if (Number.isNaN(created.getTime())) continue
    if (toLocalISO(created) !== log.logged_on) continue // typed in later — not evidence of workout time
    const existing = firstPerSession.get(log.logged_on)
    if (!existing || created < existing) firstPerSession.set(log.logged_on, created)
  }

  const times = [...firstPerSession.values()]
  if (times.length === 0) return null

  const minutes = times.map((d) => d.getHours() * 60 + d.getMinutes())
  const byHour = Array(24).fill(0) as number[]
  for (const d of times) byHour[d.getHours()]++

  // Circular mean, not a plain average. Clock time wraps, so averaging the raw
  // minute counts puts 23:00 and 01:00 at noon — the one time of day neither
  // session happened. Averaging unit vectors on the 24h circle handles midnight.
  const angles = minutes.map((m) => (m / 1440) * 2 * Math.PI)
  const sin = angles.reduce((a, t) => a + Math.sin(t), 0) / angles.length
  const cos = angles.reduce((a, t) => a + Math.cos(t), 0) / angles.length
  const average = (((Math.atan2(sin, cos) / (2 * Math.PI)) * 1440) + 1440) % 1440

  return {
    averageMinutes: average,
    label: clockLabel(average),
    earliest: clockLabel(Math.min(...minutes)),
    latest: clockLabel(Math.max(...minutes)),
    byHour,
    sessions: times.length,
  }
}

/**
 * Which split day to suggest next: the one after whatever day was logged most
 * recently, wrapping around the split. Falls back to the first day when nothing
 * matching the split has been logged yet.
 */
export function nextWorkoutDay(split: Split | null, logs: WorkoutLog[]): SplitDay | null {
  if (!split || split.split_days.length === 0) return null
  const days = split.split_days
  const names = new Set(days.map((d) => d.name))

  // Logs arrive newest-date-first; within a date they're created-time ascending.
  const dayLogs = logs.filter((log) => log.day_name && names.has(log.day_name))
  if (dayLogs.length === 0) return days[0]

  const maxDate = dayLogs.reduce((m, l) => (l.logged_on > m ? l.logged_on : m), dayLogs[0].logged_on)
  const sameDate = dayLogs.filter((l) => l.logged_on === maxDate)
  const lastName = sameDate[sameDate.length - 1].day_name

  const idx = days.findIndex((d) => d.name === lastName)
  if (idx === -1) return days[0]
  return days[(idx + 1) % days.length]
}
