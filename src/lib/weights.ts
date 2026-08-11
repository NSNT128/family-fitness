import { supabase } from './supabase'

export interface BodyWeight {
  id: string
  logged_on: string
  weight_kg: number
}

export const PERIODS = [
  { key: 'day', label: 'per day', days: 1 },
  { key: 'week', label: 'per week', days: 7 },
  { key: 'month', label: 'per month', days: 30 },
] as const

export type PeriodKey = (typeof PERIODS)[number]['key']

/** Parses a plain YYYY-MM-DD as a local date, never shifted by timezone. */
export const parseISODate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export async function fetchWeights(): Promise<BodyWeight[]> {
  const { data, error } = await supabase
    .from('body_weights')
    .select('id, logged_on, weight_kg')
    .order('logged_on', { ascending: true })
  if (error) throw error
  return ((data ?? []) as BodyWeight[]).map((w) => ({ ...w, weight_kg: Number(w.weight_kg) }))
}

/** Weighing in again on a day you've already recorded replaces that day. */
export async function saveWeight(userId: string, date: string, weightKg: number) {
  const { error } = await supabase
    .from('body_weights')
    .upsert(
      { user_id: userId, logged_on: date, weight_kg: weightKg },
      { onConflict: 'user_id,logged_on' },
    )
  if (error) throw error
}

export async function deleteWeight(id: string) {
  const { error } = await supabase.from('body_weights').delete().eq('id', id)
  if (error) throw error
}

export interface WeightChange {
  delta: number
  fromDate: string
  toDate: string
  spanDays: number
  /** False when there was no entry as far back as the period asked for. */
  exact: boolean
}

/**
 * Change between the latest weigh-in and the one closest to `days` before it.
 * If history doesn't reach back that far it falls back to the earliest entry
 * and reports the real span, rather than implying a week of data that isn't there.
 */
export function changeOver(entries: BodyWeight[], days: number): WeightChange | null {
  if (entries.length < 2) return null

  const sorted = [...entries].sort((a, b) => a.logged_on.localeCompare(b.logged_on))
  const latest = sorted[sorted.length - 1]
  const targetTime = parseISODate(latest.logged_on).getTime() - days * 86400000

  let reference: BodyWeight | null = null
  for (const entry of sorted) {
    if (parseISODate(entry.logged_on).getTime() <= targetTime) reference = entry
    else break
  }

  const exact = reference !== null
  const from = reference ?? sorted[0]
  if (from.id === latest.id) return null

  return {
    delta: latest.weight_kg - from.weight_kg,
    fromDate: from.logged_on,
    toDate: latest.logged_on,
    spanDays: Math.round(
      (parseISODate(latest.logged_on).getTime() - parseISODate(from.logged_on).getTime()) /
        86400000,
    ),
    exact,
  }
}
