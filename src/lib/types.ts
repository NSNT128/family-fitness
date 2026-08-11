export interface Profile {
  id: string
  name: string
  height_cm: number | null
  starting_weight_kg: number | null
  goal_weight_kg: number | null
  weekly_workout_goal: number
  birth_year: number | null
}

export interface Exercise {
  id: string
  user_id: string | null
  name: string
  muscle_group: string
  default_splits: string[]
}

export interface SplitDayExercise {
  id: string
  day_id: string
  exercise_id: string
  position: number
  exercises: Exercise
}

export interface SplitDay {
  id: string
  split_id: string
  name: string
  position: number
  split_day_exercises: SplitDayExercise[]
}

export interface Split {
  id: string
  name: string
  is_active: boolean
  split_days: SplitDay[]
}

export interface WorkoutLog {
  id: string
  logged_on: string
  day_name: string | null
  exercise_id: string | null
  exercise_name: string
  weight_kg: number
  reps: number
  sets: number
  rpe: number | null
  notes: string | null
  volume: number
  /** When the set was entered — used to work out what time of day you train. */
  created_at?: string
}

export interface ExercisePR {
  id: string
  exercise_id: string | null
  exercise_name: string
  best_weight_kg: number
  reps_at_best_weight: number
  best_volume_kg: number
  times_logged: number
  updated_at: string
}

/** Canonical head-to-toe ordering for grouping the library. */
export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Calves',
  'Other',
] as const

export const sortByMuscleGroup = (a: Exercise, b: Exercise) => {
  const ai = MUSCLE_GROUPS.indexOf(a.muscle_group as (typeof MUSCLE_GROUPS)[number])
  const bi = MUSCLE_GROUPS.indexOf(b.muscle_group as (typeof MUSCLE_GROUPS)[number])
  const av = ai === -1 ? MUSCLE_GROUPS.length : ai
  const bv = bi === -1 ? MUSCLE_GROUPS.length : bi
  return av - bv || a.name.localeCompare(b.name)
}
