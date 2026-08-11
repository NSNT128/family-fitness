import { supabase } from './supabase'
import type { WorkoutLog } from './types'

export interface ProgressPoint {
  logged_on: string
  weight_kg: number
  volume: number
  reps: number
  sets: number
}

/**
 * One point per session for one exercise, oldest → newest, for charting progress.
 * Keyed on exercise_name (the stable snapshot) so imported logs and logs whose
 * custom exercise was later deleted are still included. When a session has several
 * sets at different weights, the point reports the top set's weight/reps and the
 * total volume across all its sets — so the chart reads as one point per workout.
 */
export async function fetchExerciseHistory(name: string): Promise<ProgressPoint[]> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('logged_on, weight_kg, volume, reps, sets')
    .eq('exercise_name', name)
    .order('logged_on', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error

  const byDate = new Map<string, ProgressPoint>()
  for (const r of (data ?? []) as WorkoutLog[]) {
    const w = Number(r.weight_kg)
    const v = Number(r.volume)
    const cur = byDate.get(r.logged_on)
    if (!cur) {
      byDate.set(r.logged_on, { logged_on: r.logged_on, weight_kg: w, volume: v, reps: r.reps, sets: r.sets })
    } else {
      cur.volume += v
      if (w > cur.weight_kg) {
        cur.weight_kg = w // keep the heaviest set as the session's "top set"
        cur.reps = r.reps
        cur.sets = r.sets
      }
    }
  }
  return [...byDate.values()]
}

export interface ProgressStats {
  bestWeight: number
  bestVolume: number
  sessions: number
  latestWeight: number
  firstWeight: number
}

export function progressStats(points: ProgressPoint[]): ProgressStats | null {
  if (points.length === 0) return null
  return {
    bestWeight: Math.max(...points.map((p) => p.weight_kg)),
    bestVolume: Math.max(...points.map((p) => p.volume)),
    sessions: new Set(points.map((p) => p.logged_on)).size,
    latestWeight: points[points.length - 1].weight_kg,
    firstWeight: points[0].weight_kg,
  }
}
