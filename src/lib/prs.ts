import { supabase } from './supabase'
import type { ExercisePR } from './types'

export async function fetchPRs(): Promise<ExercisePR[]> {
  const { data, error } = await supabase
    .from('exercise_prs')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((pr) => ({
    ...pr,
    best_weight_kg: Number(pr.best_weight_kg),
    best_volume_kg: Number(pr.best_volume_kg),
  }))
}

export async function fetchPRsByExercise(exerciseId: string): Promise<ExercisePR | null> {
  const { data, error } = await supabase
    .from('exercise_prs')
    .select('*')
    .eq('exercise_id', exerciseId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  if (!data) return null
  return {
    ...data,
    best_weight_kg: Number(data.best_weight_kg),
    best_volume_kg: Number(data.best_volume_kg),
  }
}
