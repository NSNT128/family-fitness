import { supabase } from './supabase'
import { fetchAllLogs, type LogInput } from './logs'
import { fetchExercises } from './splits'

// Import workout history pasted straight from a spreadsheet (Google Sheets copies
// as tab-separated; CSV also works). Only rows that begin with an ISO date are
// treated as log rows, so a paste that includes headers or the split/PR tables is
// filtered down to the real entries automatically.
//
// Expected columns (extra trailing columns are ignored):
//   Date | Split/Day | Exercise | Weight | Reps | Sets | Volume(ignored) | RPE | Notes

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export interface ParsedRow extends LogInput {}

export interface ParseResult {
  rows: ParsedRow[]
  skipped: number // non-date / non-data lines quietly ignored (headers, other tables)
  invalid: number // date rows that couldn't be read (bad numbers, missing exercise)
}

const cleanCell = (s: string | undefined): string => (s ?? '').trim()

const toNum = (s: string | undefined): number | null => {
  const t = cleanCell(s).replace(',', '.')
  if (t === '' || t === '-') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function parseWorkoutText(text: string): ParseResult {
  const lines = text.split(/\r?\n/)
  const rows: ParsedRow[] = []
  let skipped = 0
  let invalid = 0

  for (const raw of lines) {
    if (raw.trim() === '') continue
    // Prefer tabs (spreadsheet copy); fall back to commas.
    const cols = (raw.includes('\t') ? raw.split('\t') : raw.split(',')).map(cleanCell)

    if (!ISO_DATE.test(cols[0] ?? '')) {
      skipped++ // header row, blank, or a different table block
      continue
    }

    const logged_on = cols[0]
    const day_name = cleanCell(cols[1]) || null
    const exercise_name = cleanCell(cols[2])
    const weight = toNum(cols[3])
    const reps = toNum(cols[4])
    const sets = toNum(cols[5])
    // cols[6] is Volume — derived in the DB, never imported.
    const rpeRaw = toNum(cols[7])
    const notes = cleanCell(cols[8]) || null

    const validReps = reps !== null && reps >= 1
    const validSets = sets !== null && sets >= 1
    const validWeight = weight !== null && weight >= 0
    if (!exercise_name || !validWeight || !validReps || !validSets) {
      invalid++
      continue
    }

    const rpe = rpeRaw !== null && rpeRaw >= 1 && rpeRaw <= 10 ? Math.round(rpeRaw) : null

    rows.push({
      logged_on,
      day_name,
      exercise_id: null, // resolved against the library at import time
      exercise_name,
      weight_kg: weight!,
      reps: Math.round(reps!),
      sets: Math.round(sets!),
      rpe,
      notes,
    })
  }

  return { rows, skipped, invalid }
}

export interface ImportSummary {
  inserted: number
  duplicates: number
  unmatched: string[] // exercise names not in the library (imported by name anyway)
}

const dedupKey = (r: { logged_on: string; exercise_name: string; weight_kg: number; reps: number; sets: number }) =>
  `${r.logged_on}|${r.exercise_name.toLowerCase()}|${Number(r.weight_kg)}|${r.reps}|${r.sets}`

/**
 * Insert parsed rows for the current user. Exercise names are matched to the
 * library (case-insensitive) to set exercise_id where possible; unmatched rows
 * still import — exercise_name is the source of truth for history and PRs. Rows
 * that already exist (same date/exercise/weight/reps/sets) are skipped so a
 * re-paste doesn't duplicate. PRs recompute automatically via DB triggers.
 */
export async function importWorkoutLogs(userId: string, rows: ParsedRow[]): Promise<ImportSummary> {
  const [exercises, existing] = await Promise.all([fetchExercises(), fetchAllLogs()])

  const byName = new Map<string, string>()
  for (const ex of exercises) byName.set(ex.name.toLowerCase(), ex.id)

  const seen = new Set(existing.map(dedupKey))
  const unmatched = new Set<string>()
  const toInsert: Array<LogInput & { user_id: string }> = []
  let duplicates = 0

  for (const r of rows) {
    const key = dedupKey(r)
    if (seen.has(key)) {
      duplicates++
      continue
    }
    seen.add(key) // also guards duplicates within the same paste

    const exercise_id = byName.get(r.exercise_name.toLowerCase()) ?? null
    if (!exercise_id) unmatched.add(r.exercise_name)

    toInsert.push({ user_id: userId, ...r, exercise_id })
  }

  // Insert in chunks to stay well under any payload limits.
  for (let i = 0; i < toInsert.length; i += 500) {
    const { error } = await supabase.from('workout_logs').insert(toInsert.slice(i, i + 500))
    if (error) throw error
  }

  return { inserted: toInsert.length, duplicates, unmatched: [...unmatched] }
}
