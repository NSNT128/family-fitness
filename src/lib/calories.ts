// Estimated calories burned during resistance training. This is deliberately an
// ESTIMATE — without heart-rate or timing data, lifting calorie burn can only be
// approximated. Model: a MET-based per-set burn driven mainly by body weight,
// nudged by an age + height factor (via a BMR ratio) so all three inputs matter.
// Always present the result to the user as "≈ … kcal (estimated)".

export interface CalorieInputs {
  weightKg: number
  heightCm: number
  age: number
}

interface ProfileLike {
  birth_year: number | null
  height_cm: number | null
  starting_weight_kg: number | null
}

/**
 * Build the inputs for the estimate, or null when we can't (no age on file, or no
 * weight to work from). Latest weigh-in is preferred; starting weight is the fallback.
 */
export function calorieInputs(profile: ProfileLike | null, latestWeightKg: number | null): CalorieInputs | null {
  if (!profile || !profile.birth_year) return null
  const weightKg =
    latestWeightKg ?? (profile.starting_weight_kg != null ? Number(profile.starting_weight_kg) : null)
  if (!weightKg || weightKg <= 0) return null
  const age = new Date().getFullYear() - profile.birth_year
  if (age < 5 || age > 120) return null
  const heightCm = profile.height_cm != null ? Number(profile.height_cm) : 170
  return { weightKg, heightCm, age }
}

const MET = 6 // vigorous resistance training during a working set
const MINUTES_PER_SET = 1 // approx active time per set

/** Estimated kcal burned by a logged entry of `sets` sets. */
export function caloriesForSets(sets: number, inp: CalorieInputs): number {
  // ACSM MET formula per minute: MET * 3.5 * kg / 200
  const perSet = ((MET * 3.5 * inp.weightKg) / 200) * MINUTES_PER_SET
  // Age/height adjustment via a BMR ratio vs a reference (170 cm, 30 yrs), clamped
  // so it's a modest ±15% nudge rather than the dominant term.
  const bmr = 10 * inp.weightKg + 6.25 * inp.heightCm - 5 * inp.age - 78
  const bmrRef = 10 * inp.weightKg + 6.25 * 170 - 5 * 30 - 78
  const factor = Math.min(1.15, Math.max(0.85, bmr / bmrRef))
  return perSet * sets * factor
}

export const caloriesForLog = (log: { sets: number }, inp: CalorieInputs): number =>
  caloriesForSets(log.sets, inp)

export const sumCalories = (logs: { sets: number }[], inp: CalorieInputs): number =>
  logs.reduce((total, l) => total + caloriesForSets(l.sets, inp), 0)
