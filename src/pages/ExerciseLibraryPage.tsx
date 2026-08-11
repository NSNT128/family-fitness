import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, Loader2, Plus, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import SubHeader from '../components/SubHeader'
import Sheet from '../components/Sheet'
import ConfirmDialog from '../components/ConfirmDialog'
import { exerciseInfoFor } from '../lib/exerciseInfo'
import ExerciseArtTile from '../components/ExerciseArtTile'
import {
  createCustomExercise,
  deleteCustomExercise,
  fetchExercises,
  isDuplicateNameError,
} from '../lib/splits'
import { MUSCLE_GROUPS, sortByMuscleGroup } from '../lib/types'
import type { Exercise } from '../lib/types'

export default function ExerciseLibraryPage() {
  const { session } = useAuth()
  const [library, setLibrary] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [group, setGroup] = useState<string>('Chest')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Exercise | null>(null)
  const [openInfo, setOpenInfo] = useState<Set<string>>(new Set())

  const toggleInfo = (id: string) =>
    setOpenInfo((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const load = useCallback(async () => {
    try {
      setLibrary(await fetchExercises())
    } catch {
      setError('Could not load the exercise library.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = library
      .filter((e) => !q || e.name.toLowerCase().includes(q))
      .sort(sortByMuscleGroup)
    const map = new Map<string, Exercise[]>()
    for (const exercise of matches) {
      const list = map.get(exercise.muscle_group) ?? []
      list.push(exercise)
      map.set(exercise.muscle_group, list)
    }
    return [...map.entries()]
  }, [library, query])

  const create = async () => {
    if (!session || !name.trim()) return
    setBusy(true)
    setError('')
    try {
      await createCustomExercise(session.user.id, name.trim(), group)
      setCreating(false)
      setName('')
      await load()
    } catch (e) {
      setError(
        isDuplicateNameError(e)
          ? 'You already have an exercise with that name.'
          : 'Could not create that exercise.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  const customCount = library.filter((e) => e.user_id).length

  return (
    <div>
      <SubHeader title="Exercise library" />

      <div className="px-5 py-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search exercises"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-surface py-3 pl-11 pr-4 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>

        <button
          onClick={() => {
            setName('')
            setError('')
            setCreating(true)
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 font-semibold text-white shadow-lg shadow-brand-600/25 active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.6} />
          Add custom exercise
        </button>

        <p className="mt-3 text-center text-sm text-gray-500">
          {library.length} exercises
          {customCount > 0 && ` · ${customCount} custom`}
        </p>

        {error && !creating && (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {grouped.map(([groupName, exercises]) => (
          <section key={groupName} className="mt-6">
            <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-gray-400">
              {groupName}
            </h2>
            <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
              {exercises.map((exercise, i) => {
                const info = exerciseInfoFor(exercise.name)
                const open = openInfo.has(exercise.id)
                return (
                  <div key={exercise.id} className={i > 0 ? 'border-t border-gray-100' : ''}>
                    <div className="flex items-center gap-3 px-4 py-4">
                      <ExerciseArtTile
                        name={exercise.name}
                        muscleGroup={exercise.muscle_group}
                        size="h-11 w-11"
                        artSize="h-8 w-8"
                      />
                      {info ? (
                        <button
                          onClick={() => toggleInfo(exercise.id)}
                          aria-expanded={open}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <span className="truncate font-medium text-gray-900">{exercise.name}</span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-gray-300 transition-transform ${
                              open ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      ) : (
                        <span className="min-w-0 flex-1 font-medium text-gray-900">
                          {exercise.name}
                        </span>
                      )}
                      {exercise.user_id ? (
                        <>
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                            Custom
                          </span>
                          <button
                            onClick={() => setConfirmDelete(exercise)}
                            aria-label={`Delete ${exercise.name}`}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 active:bg-red-50 active:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-300">Built-in</span>
                      )}
                    </div>
                    {info && open && (
                      <div className="px-4 pb-4">
                        <div className="rounded-xl bg-gray-50 p-3.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                            {info.muscles}
                          </p>
                          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                            {info.howTo}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {grouped.length === 0 && (
          <p className="mt-8 text-center text-gray-500">No exercises match “{query}”.</p>
        )}
      </div>

      <Sheet
        open={creating}
        title="New exercise"
        onClose={() => {
          setCreating(false)
          setError('')
        }}
      >
        <div className="px-5 py-5">
          <input
            autoFocus
            type="text"
            placeholder="Exercise name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-gray-300 bg-surface px-4 py-4 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <p className="mb-2 mt-5 text-sm font-medium text-gray-600">Muscle group</p>
          <div className="flex flex-wrap gap-2">
            {MUSCLE_GROUPS.map((option) => (
              <button
                key={option}
                onClick={() => setGroup(option)}
                className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                  group === option
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <button
            onClick={create}
            disabled={!name.trim() || busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 font-semibold text-white active:scale-[0.98] disabled:opacity-40"
          >
            {busy && <Loader2 className="h-5 w-5 animate-spin" />}
            Create exercise
          </button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this exercise?"
        message={`"${confirmDelete?.name}" will be removed from your library and from any split days it's on.`}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          const exercise = confirmDelete
          setConfirmDelete(null)
          if (!exercise) return
          try {
            await deleteCustomExercise(exercise.id)
            await load()
          } catch {
            setError('Could not delete that exercise.')
          }
        }}
      />
    </div>
  )
}
