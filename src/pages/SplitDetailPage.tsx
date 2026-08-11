import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  Check,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import SubHeader from '../components/SubHeader'
import Sheet from '../components/Sheet'
import ConfirmDialog from '../components/ConfirmDialog'
import ExercisePicker from '../components/ExercisePicker'
import {
  addDay,
  addExercisesToDay,
  createCustomExercise,
  deleteDay,
  deleteSplit,
  fetchExercises,
  fetchSplit,
  removeExerciseFromDay,
  renameDay,
  renameSplit,
  nextExercisePosition,
  reorderDayExercises,
  setActiveSplit,
} from '../lib/splits'
import type { Exercise, Split, SplitDay } from '../lib/types'

export default function SplitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useAuth()
  const navigate = useNavigate()

  const [split, setSplit] = useState<Split | null>(null)
  const [library, setLibrary] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [pickerDay, setPickerDay] = useState<SplitDay | null>(null)
  const [renamingSplit, setRenamingSplit] = useState(false)
  const [splitNameDraft, setSplitNameDraft] = useState('')
  const [dayDialog, setDayDialog] = useState<{ mode: 'add' | 'rename'; day?: SplitDay } | null>(null)
  const [dayNameDraft, setDayNameDraft] = useState('')
  const [confirmDeleteSplit, setConfirmDeleteSplit] = useState(false)
  const [confirmDeleteDay, setConfirmDeleteDay] = useState<SplitDay | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const [splitData, exerciseData] = await Promise.all([fetchSplit(id), fetchExercises()])
      setSplit(splitData)
      setLibrary(exerciseData)
    } catch {
      setError('Could not load this split.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const run = async (action: () => Promise<unknown>) => {
    setError('')
    try {
      await action()
      await load()
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  const handleActivate = () => split && run(() => setActiveSplit(split.id))

  const handleRenameSplit = async () => {
    if (!split || !splitNameDraft.trim()) return
    setRenamingSplit(false)
    await run(() => renameSplit(split.id, splitNameDraft.trim()))
  }

  const handleDaySubmit = async () => {
    if (!session || !split || !dayNameDraft.trim()) return
    const dialog = dayDialog
    setDayDialog(null)
    if (dialog?.mode === 'add') {
      await run(() =>
        addDay(session.user.id, split.id, dayNameDraft.trim(), split.split_days.length),
      )
    } else if (dialog?.day) {
      await run(() => renameDay(dialog.day!.id, dayNameDraft.trim()))
    }
  }

  const move = (day: SplitDay, index: number, direction: -1 | 1) => {
    const rows = [...day.split_day_exercises]
    const to = index + direction
    if (to < 0 || to >= rows.length) return
    // Move within the list, then renumber the whole day. Renumbering (rather than
    // swapping two position values) also repairs days whose positions collided.
    const [moved] = rows.splice(index, 1)
    rows.splice(to, 0, moved)
    run(() => reorderDayExercises(rows.map((r) => r.id)))
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  if (!split) {
    return (
      <div>
        <SubHeader title="Split" />
        <p className="px-5 py-8 text-center text-gray-500">This split no longer exists.</p>
      </div>
    )
  }

  return (
    <div>
      <SubHeader
        title={split.name}
        action={
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => {
                setSplitNameDraft(split.name)
                setRenamingSplit(true)
              }}
              aria-label="Rename split"
              className="flex h-11 w-11 items-center justify-center rounded-full text-gray-600 active:bg-gray-100"
            >
              <Pencil className="h-5 w-5" />
            </button>
            <button
              onClick={() => setConfirmDeleteSplit(true)}
              aria-label="Delete split"
              className="flex h-11 w-11 items-center justify-center rounded-full text-red-600 active:bg-red-50"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        }
      />

      <div className="px-5 py-5">
        {split.is_active ? (
          <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3.5">
            <Check className="h-5 w-5 shrink-0 text-green-700" strokeWidth={2.6} />
            <p className="font-semibold text-green-800">This is your active split</p>
          </div>
        ) : (
          <button
            onClick={handleActivate}
            className="w-full rounded-2xl border-2 border-brand-600 bg-surface py-3.5 font-semibold text-brand-700 active:scale-[0.98]"
          >
            Make this my active split
          </button>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 space-y-4">
          {split.split_days.map((day) => (
            <section key={day.id} className="overflow-hidden rounded-2xl bg-surface shadow-sm">
              <div className="flex items-center gap-1 border-b border-gray-100 px-5 py-3.5">
                <h2 className="min-w-0 flex-1 truncate text-lg font-bold text-gray-900">
                  {day.name}
                </h2>
                <button
                  onClick={() => {
                    setDayNameDraft(day.name)
                    setDayDialog({ mode: 'rename', day })
                  }}
                  aria-label={`Rename ${day.name}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 active:bg-gray-100"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setConfirmDeleteDay(day)}
                  aria-label={`Delete ${day.name}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-red-500 active:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {day.split_day_exercises.length === 0 ? (
                <p className="px-5 py-5 text-sm text-gray-400">No exercises on this day yet.</p>
              ) : (
                <ul>
                  {day.split_day_exercises.map((row, i) => (
                    <li
                      key={row.id}
                      className={`flex items-center gap-2 px-3 py-3 ${
                        i > 0 ? 'border-t border-gray-50' : ''
                      }`}
                    >
                      <span className="w-6 shrink-0 text-center text-sm font-semibold text-gray-300">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">{row.exercises.name}</p>
                        <p className="text-xs text-gray-400">{row.exercises.muscle_group}</p>
                      </div>
                      <button
                        onClick={() => move(day, i, -1)}
                        disabled={i === 0}
                        aria-label={`Move ${row.exercises.name} up`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 active:bg-gray-100 disabled:opacity-20"
                      >
                        <ArrowUp className="h-4 w-4" strokeWidth={2.6} />
                      </button>
                      <button
                        onClick={() => move(day, i, 1)}
                        disabled={i === day.split_day_exercises.length - 1}
                        aria-label={`Move ${row.exercises.name} down`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 active:bg-gray-100 disabled:opacity-20"
                      >
                        <ArrowDown className="h-4 w-4" strokeWidth={2.6} />
                      </button>
                      <button
                        onClick={() => run(() => removeExerciseFromDay(row.id))}
                        aria-label={`Remove ${row.exercises.name}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 active:bg-red-50 active:text-red-600"
                      >
                        <X className="h-4 w-4" strokeWidth={2.6} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={() => setPickerDay(day)}
                className="flex w-full items-center justify-center gap-2 border-t border-gray-100 py-3.5 font-semibold text-brand-600 active:bg-brand-50"
              >
                <Plus className="h-5 w-5" strokeWidth={2.6} />
                Add exercise
              </button>
            </section>
          ))}
        </div>

        <button
          onClick={() => {
            setDayNameDraft('')
            setDayDialog({ mode: 'add' })
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-surface py-4 font-semibold text-gray-700 active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.6} />
          Add day
        </button>
      </div>

      <ExercisePicker
        open={pickerDay !== null}
        library={library}
        alreadyAdded={pickerDay?.split_day_exercises.map((r) => r.exercise_id) ?? []}
        onClose={() => setPickerDay(null)}
        onAdd={async (exerciseIds) => {
          if (!session || !pickerDay) return
          await addExercisesToDay(
            session.user.id,
            pickerDay.id,
            exerciseIds,
            // max+1, not length — length collides with an existing position
            // whenever an exercise was removed from the middle earlier.
            await nextExercisePosition(pickerDay.id),
          )
          await load()
        }}
        onCreateCustom={async (name, muscleGroup) => {
          if (!session) throw new Error('Not signed in')
          const created = await createCustomExercise(session.user.id, name, muscleGroup)
          setLibrary((prev) => [...prev, created])
          return created
        }}
      />

      <Sheet open={renamingSplit} title="Rename split" onClose={() => setRenamingSplit(false)}>
        <div className="px-5 py-5">
          <input
            autoFocus
            type="text"
            value={splitNameDraft}
            onChange={(e) => setSplitNameDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameSplit()}
            className="w-full rounded-2xl border border-gray-300 bg-surface px-4 py-4 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <button
            onClick={handleRenameSplit}
            disabled={!splitNameDraft.trim()}
            className="mt-4 w-full rounded-xl bg-brand-600 py-4 font-semibold text-white active:scale-[0.98] disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </Sheet>

      <Sheet
        open={dayDialog !== null}
        title={dayDialog?.mode === 'add' ? 'Add day' : 'Rename day'}
        onClose={() => setDayDialog(null)}
      >
        <div className="px-5 py-5">
          <input
            autoFocus
            type="text"
            value={dayNameDraft}
            onChange={(e) => setDayNameDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDaySubmit()}
            placeholder="e.g. Push, Legs, Upper"
            className="w-full rounded-2xl border border-gray-300 bg-surface px-4 py-4 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          {dayDialog?.mode === 'add' && (
            <div className="mt-3 flex flex-wrap gap-2">
              {['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setDayNameDraft(suggestion)}
                  className="rounded-full bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleDaySubmit}
            disabled={!dayNameDraft.trim()}
            className="mt-5 w-full rounded-xl bg-brand-600 py-4 font-semibold text-white active:scale-[0.98] disabled:opacity-40"
          >
            {dayDialog?.mode === 'add' ? 'Add day' : 'Save'}
          </button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirmDeleteSplit}
        title="Delete this split?"
        message={`"${split.name}" and all its days will be removed. This can't be undone.`}
        onCancel={() => setConfirmDeleteSplit(false)}
        onConfirm={async () => {
          setConfirmDeleteSplit(false)
          try {
            await deleteSplit(split.id)
            navigate('/profile/splits')
          } catch {
            setError('Could not delete that split.')
          }
        }}
      />

      <ConfirmDialog
        open={confirmDeleteDay !== null}
        title="Delete this day?"
        message={`"${confirmDeleteDay?.name}" and its exercises will be removed from this split.`}
        onCancel={() => setConfirmDeleteDay(null)}
        onConfirm={async () => {
          const day = confirmDeleteDay
          setConfirmDeleteDay(null)
          if (day) await run(() => deleteDay(day.id))
        }}
      />
    </div>
  )
}
