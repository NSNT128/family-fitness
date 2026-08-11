import { useMemo, useState } from 'react'
import { Check, Plus, Search, Sparkles } from 'lucide-react'
import Sheet from './Sheet'
import { isDuplicateNameError } from '../lib/splits'
import ExerciseArt from '../lib/exerciseArt'
import { MUSCLE_GROUPS, sortByMuscleGroup } from '../lib/types'
import type { Exercise } from '../lib/types'

interface ExercisePickerProps {
  open: boolean
  library: Exercise[]
  alreadyAdded: string[]
  onClose: () => void
  onAdd: (exerciseIds: string[]) => Promise<void>
  onCreateCustom: (name: string, muscleGroup: string) => Promise<Exercise>
}

export default function ExercisePicker({
  open,
  library,
  alreadyAdded,
  onClose,
  onAdd,
  onCreateCustom,
}: ExercisePickerProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customGroup, setCustomGroup] = useState<string>('Chest')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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

  const reset = () => {
    setQuery('')
    setSelected([])
    setCreating(false)
    setCustomName('')
    setError('')
  }

  const close = () => {
    reset()
    onClose()
  }

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleAdd = async () => {
    if (!selected.length) return
    setBusy(true)
    try {
      await onAdd(selected)
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add those exercises.')
    } finally {
      setBusy(false)
    }
  }

  const handleCreateCustom = async () => {
    const name = customName.trim()
    if (!name) return
    setBusy(true)
    setError('')
    try {
      const created = await onCreateCustom(name, customGroup)
      setSelected((prev) => [...prev, created.id])
      setCreating(false)
      setCustomName('')
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

  return (
    <Sheet open={open} title="Add exercises" onClose={close}>
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-surface px-5 py-3">
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
      </div>

      <div className="px-5 pb-4 pt-3">
        {creating ? (
          <div className="rounded-2xl bg-surface p-4 shadow-sm">
            <p className="mb-3 font-semibold text-gray-900">New custom exercise</p>
            <input
              autoFocus
              type="text"
              placeholder="Exercise name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <p className="mb-2 mt-4 text-sm font-medium text-gray-600">Muscle group</p>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setCustomGroup(group)}
                  className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                    customGroup === group
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setCreating(false)
                  setError('')
                }}
                className="flex-1 rounded-xl border border-gray-200 py-3.5 font-semibold text-gray-700 active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!customName.trim() || busy}
                onClick={handleCreateCustom}
                className="flex-1 rounded-xl bg-brand-600 py-3.5 font-semibold text-white active:scale-[0.98] disabled:opacity-40"
              >
                Create
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-brand-300 bg-brand-50/60 px-4 py-4 text-left active:scale-[0.99]"
          >
            <Sparkles className="h-5 w-5 shrink-0 text-brand-600" />
            <span className="font-semibold text-brand-700">Create a custom exercise</span>
          </button>
        )}

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {grouped.map(([group, exercises]) => (
          <section key={group} className="mt-6">
            <h3 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-gray-400">
              {group}
            </h3>
            <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
              {exercises.map((exercise, i) => {
                const isSelected = selected.includes(exercise.id)
                const isAdded = alreadyAdded.includes(exercise.id)
                return (
                  <button
                    key={exercise.id}
                    type="button"
                    disabled={isAdded}
                    onClick={() => toggle(exercise.id)}
                    className={`flex w-full items-center gap-3 px-4 py-4 text-left ${
                      i > 0 ? 'border-t border-gray-100' : ''
                    } ${isAdded ? 'opacity-40' : 'active:bg-gray-50'}`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                        isSelected
                          ? 'border-brand-600 bg-brand-600'
                          : 'border-gray-300 bg-surface'
                      }`}
                    >
                      {isSelected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <ExerciseArt
                        name={exercise.name}
                        muscleGroup={exercise.muscle_group}
                        className="h-7 w-7 text-gray-500"
                      />
                    </span>
                    <span className="min-w-0 flex-1 font-medium text-gray-900">{exercise.name}</span>
                    {isAdded && <span className="text-xs font-medium text-gray-400">Added</span>}
                    {exercise.user_id && !isAdded && (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        Custom
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        ))}

        {grouped.length === 0 && (
          <p className="mt-8 text-center text-gray-500">No exercises match “{query}”.</p>
        )}
      </div>

      {selected.length > 0 && (
        <div className="sticky bottom-0 border-t border-gray-200 bg-surface px-5 py-3">
          <button
            type="button"
            onClick={handleAdd}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 text-base font-semibold text-white active:scale-[0.98] disabled:opacity-60"
          >
            <Plus className="h-5 w-5" strokeWidth={2.6} />
            Add {selected.length} exercise{selected.length > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </Sheet>
  )
}
