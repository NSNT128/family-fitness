import { supabase } from './supabase'
import type { CalorieInputs } from './calories'

export interface CardioLog {
  id: string
  logged_on: string
  machine: string
  speed_kmh: number
  incline_pct: number
  minutes: number
  notes: string | null
  distance_km: number
  created_at: string
}

export interface CardioInput {
  logged_on: string
  machine: string
  speed_kmh: number
  incline_pct: number
  minutes: number
  notes: string | null
}

export const MACHINES = ['Treadmill', 'Bike', 'Rower', 'Elliptical', 'Stairmaster', 'Outdoor run']

/**
 * Estimated kcal from the ACSM metabolic equations, which take grade into account
 * — so incline actually changes the number rather than being decoration.
 *
 *   walking  VO2 = 0.1·S + 1.8·S·G + 3.5
 *   running  VO2 = 0.2·S + 0.9·S·G + 3.5      (S = m/min, G = grade as a fraction)
 *   kcal/min = VO2 · kg / 1000 · 5
 *
 * Still an estimate: machine speed isn't effort, and the equations are calibrated
 * for walking/running, so other machines borrow the closest curve.
 */
export function cardioCalories(
  log: { speed_kmh: number; incline_pct: number; minutes: number },
  inp: CalorieInputs,
): number {
  const speed = Number(log.speed_kmh)
  const minutes = Number(log.minutes)
  if (speed <= 0 || minutes <= 0) return 0
  const metresPerMin = (speed * 1000) / 60
  const grade = Number(log.incline_pct) / 100
  // 7 km/h is the usual walk/jog changeover.
  const vo2 =
    speed < 7
      ? 0.1 * metresPerMin + 1.8 * metresPerMin * grade + 3.5
      : 0.2 * metresPerMin + 0.9 * metresPerMin * grade + 3.5
  return ((vo2 * inp.weightKg) / 1000) * 5 * minutes
}

export interface CardioTotals {
  minutes: number
  distanceKm: number
  /** Distance-weighted, so mixed-speed entries average honestly. */
  avgSpeedKmh: number
  /** Minutes per km, the inverse of avgSpeedKmh. */
  avgPaceMinPerKm: number
  sessions: number
}

export function cardioTotals(logs: CardioLog[]): CardioTotals {
  const minutes = logs.reduce((s, l) => s + Number(l.minutes), 0)
  const distanceKm = logs.reduce((s, l) => s + Number(l.distance_km), 0)
  return {
    minutes,
    distanceKm,
    avgSpeedKmh: minutes > 0 ? distanceKm / (minutes / 60) : 0,
    avgPaceMinPerKm: distanceKm > 0 ? minutes / distanceKm : 0,
    sessions: new Set(logs.map((l) => l.logged_on)).size,
  }
}

/** "1h 05m" / "45 min" — durations read faster than a bare minute count. */
export function formatDuration(minutes: number): string {
  const total = Math.round(minutes)
  if (total < 60) return `${total} min`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m === 0 ? `${h}h` : `${h}h ${String(m).padStart(2, '0')}m`
}

export function formatPace(minPerKm: number): string {
  if (!Number.isFinite(minPerKm) || minPerKm <= 0) return '—'
  const m = Math.floor(minPerKm)
  const s = Math.round((minPerKm - m) * 60)
  return s === 60 ? `${m + 1}:00 /km` : `${m}:${String(s).padStart(2, '0')} /km`
}

export async function fetchCardio(): Promise<CardioLog[]> {
  const { data, error } = await supabase
    .from('cardio_logs')
    .select('*')
    .order('logged_on', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as CardioLog[]
}

export async function createCardio(userId: string, input: CardioInput) {
  const { error } = await supabase.from('cardio_logs').insert({ user_id: userId, ...input })
  if (error) throw error
}

export async function updateCardio(id: string, input: Partial<CardioInput>) {
  const { error } = await supabase.from('cardio_logs').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteCardio(id: string) {
  const { error } = await supabase.from('cardio_logs').delete().eq('id', id)
  if (error) throw error
}
