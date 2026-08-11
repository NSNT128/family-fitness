import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Loader2, Trophy } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'
import ExerciseArtTile from '../components/ExerciseArtTile'
import { fetchPRs } from '../lib/prs'
import { fetchExercises } from '../lib/splits'
import type { Exercise, ExercisePR } from '../lib/types'

/** Muscle groups rolled up into the areas people actually think in. */
const AREA_OF: Record<string, string> = {
  Chest: 'Chest',
  Back: 'Back',
  Shoulders: 'Shoulders',
  Biceps: 'Arms',
  Triceps: 'Arms',
  Quads: 'Legs',
  Hamstrings: 'Legs',
  Calves: 'Legs',
  Other: 'Other',
}

const AREA_ORDER = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Other']

export default function PRPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [prs, setPRs] = useState<ExercisePR[]>([])
  const [library, setLibrary] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!session) return
      try {
        const [data, exercises] = await Promise.all([fetchPRs(), fetchExercises()])
        setPRs(data)
        setLibrary(exercises)
      } catch {
        setError('Could not load your PRs.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [session])

  /**
   * PRs into body-area sections, head to toe.
   *
   * Coarser than the Exercise Library's muscle groups on purpose: splitting legs
   * into Quads/Hamstrings/Calves would file Leg Extension and Leg Curl under
   * different headings, which is the opposite of making a long list scannable.
   * The precise muscle still shows on each row, so nothing is lost.
   */
  const sections = useMemo(() => {
    const byId = new Map(library.map((e) => [e.id, e.muscle_group]))
    const byName = new Map(library.map((e) => [e.name.trim().toLowerCase(), e.muscle_group]))
    const groups = new Map<string, { pr: ExercisePR; muscle: string }[]>()

    for (const pr of prs) {
      // A PR for a deleted custom exercise has no library row left, so fall back to
      // a name match and then "Other" — a record must never vanish from this list.
      const muscle =
        (pr.exercise_id ? byId.get(pr.exercise_id) : undefined) ??
        byName.get(pr.exercise_name.trim().toLowerCase()) ??
        'Other'
      const area = AREA_OF[muscle] ?? 'Other'
      const list = groups.get(area) ?? []
      list.push({ pr, muscle })
      groups.set(area, list)
    }

    return [...groups.entries()]
      .map(([area, list]) => ({
        area,
        list: [...list].sort((a, b) => a.pr.exercise_name.localeCompare(b.pr.exercise_name)),
      }))
      .sort((a, b) => {
        const ai = AREA_ORDER.indexOf(a.area)
        const bi = AREA_ORDER.indexOf(b.area)
        return (ai === -1 ? AREA_ORDER.length : ai) - (bi === -1 ? AREA_ORDER.length : bi)
      })
  }, [prs, library])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  const empty = prs.length === 0

  return (
    <div>
      <PageHeader
        title="Personal Records"
        subtitle={empty ? undefined : `${prs.length} exercise${prs.length === 1 ? '' : 's'}`}
      />

      <div className="px-5 py-2">
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {empty ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-surface px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
              <Trophy className="h-7 w-7 text-brand-600" />
            </div>
            <p className="font-semibold text-gray-900">No PRs yet</p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Log your first workout to start tracking personal records.
            </p>
          </div>
        ) : (
          sections.map(({ area, list }) => (
          <section key={area} className="mb-6">
            <h2 className="mb-2 flex items-baseline justify-between px-1">
              <span className="text-sm font-bold uppercase tracking-wide text-gray-400">
                {area}
              </span>
              <span className="text-xs font-medium text-gray-400">{list.length}</span>
            </h2>
            <div className="space-y-2">
            {list.map(({ pr, muscle }) => (
              // A card, not one big button: the picture zooms, the rest opens the
              // progress chart — nesting those as buttons would be invalid markup.
              <div
                key={pr.id}
                className="flex items-start gap-3 overflow-hidden rounded-2xl bg-surface p-4 shadow-sm"
              >
                <ExerciseArtTile name={pr.exercise_name} size="h-11 w-11" artSize="h-8 w-8" />
                <button
                  onClick={() => navigate(`/progress/${encodeURIComponent(pr.exercise_name)}`)}
                  className="min-w-0 flex-1 text-left active:scale-[0.99]"
                >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900">{pr.exercise_name}</p>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </div>
                    {/* The precise muscle, so rolling up to areas loses nothing. */}
                    {muscle !== area && (
                      <p className="mt-0.5 text-xs font-medium text-gray-400">{muscle}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Best weight
                        </p>
                        <p className="mt-0.5 font-bold text-gray-900">
                          {pr.best_weight_kg.toFixed(1)} kg × {pr.reps_at_best_weight}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Max volume
                        </p>
                        <p className="mt-0.5 font-bold text-gray-900">
                          {pr.best_volume_kg.toFixed(0)} kg
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 rounded-xl bg-brand-50 px-3 py-2 text-center">
                    <p className="text-2xl font-bold text-brand-600">{pr.times_logged}</p>
                    <p className="text-xs font-medium text-brand-700">times</p>
                  </div>
                </div>
                </button>
              </div>
            ))}
            </div>
          </section>
          ))
        )}
      </div>
    </div>
  )
}
