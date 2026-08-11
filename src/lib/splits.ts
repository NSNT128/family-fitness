import { supabase } from './supabase'
import type { Exercise, Split } from './types'

export interface SplitTemplate {
  key: string
  name: string
  blurb: string
  days: { name: string; exercises: string[] }[]
}

/**
 * Starting points so a new split is one tap rather than a blank page.
 * Exercise names must match the pre-loaded library in supabase/phase2.sql.
 */
export const SPLIT_TEMPLATES: SplitTemplate[] = [
  {
    key: 'ppl',
    name: 'Push / Pull / Legs',
    blurb: '3 days — the classic PPL',
    days: [
      {
        name: 'Push',
        exercises: [
          'Bench Press',
          'Overhead Press',
          'Incline DB Press',
          'Lateral Raise',
          'Triceps Pushdown',
        ],
      },
      {
        name: 'Pull',
        exercises: [
          'Deadlift',
          'Barbell Row',
          'Pull-Up',
          'Lat Pulldown',
          'Face Pull',
          'Preacher Curl',
        ],
      },
      {
        name: 'Legs',
        exercises: [
          'Squat',
          'Romanian Deadlift',
          'Leg Curl',
          'Leg Extension',
          'Calf Raise',
          'Bulgarian Split Squat',
        ],
      },
    ],
  },
  {
    key: 'ul',
    name: 'Upper / Lower',
    blurb: '2 days — simple and flexible',
    days: [
      { name: 'Upper', exercises: ['Bench Press', 'Barbell Row', 'Overhead Press', 'Pull-Up'] },
      { name: 'Lower', exercises: ['Squat', 'Leg Extension', 'Leg Press', 'Leg Curl'] },
    ],
  },
  {
    key: 'ppl-ul',
    name: 'PPL + Upper / Lower',
    blurb: '5 days — hybrid, higher frequency',
    days: [
      {
        name: 'Push',
        exercises: [
          'Bench Press',
          'Overhead Press',
          'Incline DB Press',
          'Lateral Raise',
          'Triceps Pushdown',
        ],
      },
      {
        name: 'Pull',
        exercises: ['Deadlift', 'Barbell Row', 'Pull-Up', 'Lat Pulldown', 'Face Pull', 'Preacher Curl'],
      },
      {
        name: 'Legs',
        exercises: ['Squat', 'Romanian Deadlift', 'Leg Curl', 'Leg Extension', 'Calf Raise'],
      },
      { name: 'Upper', exercises: ['Bench Press', 'Barbell Row', 'Overhead Press', 'Pull-Up'] },
      { name: 'Lower', exercises: ['Squat', 'Leg Extension', 'Leg Press', 'Leg Curl'] },
    ],
  },
  {
    key: 'fullbody',
    name: 'Full Body',
    blurb: '2 days — hit everything each session',
    days: [
      { name: 'Full Body A', exercises: ['Squat', 'Bench Press', 'Barbell Row'] },
      { name: 'Full Body B', exercises: ['Deadlift', 'Overhead Press', 'Lat Pulldown'] },
    ],
  },
  {
    key: 'blank',
    name: 'Start from scratch',
    blurb: 'Build your own days',
    days: [],
  },
]

const SPLIT_QUERY =
  'id, name, is_active, split_days(id, split_id, name, position, ' +
  'split_day_exercises(id, day_id, exercise_id, position, exercises(*)))'

/** Days and their exercises come back in the order the user arranged them. */
const sortSplit = (split: Split): Split => ({
  ...split,
  split_days: [...(split.split_days ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((day) => ({
      ...day,
      split_day_exercises: [...(day.split_day_exercises ?? [])].sort(
        (a, b) => a.position - b.position,
      ),
    })),
})

export async function fetchSplits(): Promise<Split[]> {
  const { data, error } = await supabase
    .from('splits')
    .select(SPLIT_QUERY)
    .order('created_at', { ascending: true })
  if (error) throw error
  return ((data ?? []) as unknown as Split[]).map(sortSplit)
}

export async function fetchSplit(id: string): Promise<Split | null> {
  const { data, error } = await supabase.from('splits').select(SPLIT_QUERY).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? sortSplit(data as unknown as Split) : null
}

export async function fetchExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase.from('exercises').select('*')
  if (error) throw error
  return (data ?? []) as Exercise[]
}

export async function createSplitFromTemplate(
  userId: string,
  name: string,
  template: SplitTemplate,
  library: Exercise[],
  makeActive: boolean,
): Promise<string> {
  const { data: split, error: splitError } = await supabase
    .from('splits')
    .insert({ user_id: userId, name, is_active: makeActive })
    .select('id')
    .single()
  if (splitError) throw splitError

  if (template.days.length === 0) return split.id

  const { data: days, error: daysError } = await supabase
    .from('split_days')
    .insert(
      template.days.map((day, i) => ({
        split_id: split.id,
        user_id: userId,
        name: day.name,
        position: i,
      })),
    )
    .select('id, name, position')
  if (daysError) throw daysError

  const byName = new Map(library.map((e) => [e.name.toLowerCase(), e.id]))
  const rows = (days ?? [])
    .sort((a, b) => a.position - b.position)
    .flatMap((day, dayIndex) =>
      template.days[dayIndex].exercises
        .map((exerciseName, i) => {
          const exerciseId = byName.get(exerciseName.toLowerCase())
          return exerciseId
            ? { day_id: day.id, user_id: userId, exercise_id: exerciseId, position: i }
            : null
        })
        .filter((row): row is NonNullable<typeof row> => row !== null),
    )

  if (rows.length) {
    const { error } = await supabase.from('split_day_exercises').insert(rows)
    if (error) throw error
  }
  return split.id
}

export async function setActiveSplit(splitId: string) {
  // A database trigger stands the other splits down, so this is a single write.
  const { error } = await supabase.from('splits').update({ is_active: true }).eq('id', splitId)
  if (error) throw error
}

export async function renameSplit(splitId: string, name: string) {
  const { error } = await supabase.from('splits').update({ name }).eq('id', splitId)
  if (error) throw error
}

export async function deleteSplit(splitId: string) {
  const { error } = await supabase.from('splits').delete().eq('id', splitId)
  if (error) throw error
}

export async function addDay(userId: string, splitId: string, name: string, position: number) {
  const { error } = await supabase
    .from('split_days')
    .insert({ split_id: splitId, user_id: userId, name, position })
  if (error) throw error
}

export async function renameDay(dayId: string, name: string) {
  const { error } = await supabase.from('split_days').update({ name }).eq('id', dayId)
  if (error) throw error
}

export async function deleteDay(dayId: string) {
  const { error } = await supabase.from('split_days').delete().eq('id', dayId)
  if (error) throw error
}

export async function addExercisesToDay(
  userId: string,
  dayId: string,
  exerciseIds: string[],
  startPosition: number,
) {
  const { error } = await supabase.from('split_day_exercises').insert(
    exerciseIds.map((exercise_id, i) => ({
      day_id: dayId,
      user_id: userId,
      exercise_id,
      position: startPosition + i,
    })),
  )
  if (error) throw error
}

export async function removeExerciseFromDay(rowId: string) {
  const { error } = await supabase.from('split_day_exercises').delete().eq('id', rowId)
  if (error) throw error
}

/** Swaps two neighbours' positions to move one up or down the list. */
/**
 * Write a day's exercises back as positions 0..n-1, in the given order.
 *
 * Deliberately not a two-row swap. Adds used to number from `list.length`, so
 * removing from the middle of [0,1,2,3] left [0,2,3] and the next add landed on 3
 * — a duplicate. Swapping two equal positions changes nothing, which is exactly
 * why the arrows looked dead on some days but not others. Renumbering the whole
 * list is immune to that, and repairs any day it touches.
 */
export async function reorderDayExercises(rowIdsInOrder: string[]) {
  const results = await Promise.all(
    rowIdsInOrder.map((id, position) =>
      supabase.from('split_day_exercises').update({ position }).eq('id', id),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}

/** The next free position for a day — max+1, never `length` (see above). */
export async function nextExercisePosition(dayId: string): Promise<number> {
  const { data, error } = await supabase
    .from('split_day_exercises')
    .select('position')
    .eq('day_id', dayId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? Number(data.position) + 1 : 0
}

/**
 * Supabase rejects a repeated exercise name with Postgres code 23505.
 * Its errors are plain objects rather than Error instances, so this checks
 * the code directly instead of reading `.message` off an Error.
 */
export const isDuplicateNameError = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && (e as { code?: string }).code === '23505'

export async function createCustomExercise(userId: string, name: string, muscleGroup: string) {
  const { data, error } = await supabase
    .from('exercises')
    .insert({ user_id: userId, name, muscle_group: muscleGroup })
    .select('*')
    .single()
  if (error) throw error
  return data as Exercise
}

export async function deleteCustomExercise(id: string) {
  const { error } = await supabase.from('exercises').delete().eq('id', id)
  if (error) throw error
}
