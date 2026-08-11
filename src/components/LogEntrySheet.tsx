import { useEffect, useState } from 'react'
import { ChevronDown, History, Info, Loader2, MessageSquarePlus, Trash2 } from 'lucide-react'
import Sheet from './Sheet'
import Stepper from './Stepper'
import { exerciseInfoFor } from '../lib/exerciseInfo'
import ExerciseArtTile from './ExerciseArtTile'
import type { WorkoutLog } from '../lib/types'

export interface LogValues {
  weight_kg: number
  reps: number
  sets: number
  rpe: number | null
  notes: string | null
}

interface LogEntrySheetProps {
  open: boolean
  exerciseName: string
  /** Helps pick the diagram for a custom exercise the name doesn't identify. */
  muscleGroup?: string | null
  /** Most recent entry for this exercise — shown as context and used to pre-fill. */
  lastEntry?: WorkoutLog | null
  /** Set when editing an entry that already exists. */
  existing?: WorkoutLog | null
  onClose: () => void
  onSave: (values: LogValues) => Promise<void>
  onDelete?: () => Promise<void>
}

const RPE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function LogEntrySheet({
  open,
  exerciseName,
  muscleGroup,
  lastEntry,
  existing,
  onClose,
  onSave,
  onDelete,
}: LogEntrySheetProps) {
  const [weight, setWeight] = useState(20)
  const [reps, setReps] = useState(8)
  const [sets, setSets] = useState(3)
  const [rpe, setRpe] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [showHow, setShowHow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const info = exerciseInfoFor(exerciseName)

  // Opening the sheet starts you where you finished last time, so an unchanged
  // session is a single tap on Save.
  useEffect(() => {
    if (!open) return
    const source = existing ?? lastEntry
    setWeight(source ? Number(source.weight_kg) : 20)
    setReps(source ? source.reps : 8)
    setSets(source ? source.sets : 3)
    setRpe(existing ? existing.rpe : null)
    setNotes(existing?.notes ?? '')
    setShowNotes(Boolean(existing?.notes))
    setShowHow(false)
    setError('')
    setBusy(false)
  }, [open, existing, lastEntry])

  const volume = weight * reps * sets

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      await onSave({
        weight_kg: weight,
        reps,
        sets,
        rpe,
        notes: notes.trim() || null,
      })
      onClose()
    } catch {
      setError('Could not save that. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} title={exerciseName} onClose={onClose}>
      <div className="px-5 py-4">
        <div className="mb-4 flex items-center gap-3">
          <ExerciseArtTile
            name={exerciseName}
            muscleGroup={muscleGroup}
            size="h-16 w-16"
            artSize="h-12 w-12"
          />
          {info ? (
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setShowHow((s) => !s)}
                aria-expanded={showHow}
                className="flex w-full items-center gap-2 text-left"
              >
                <Info className="h-4 w-4 shrink-0 text-brand-600" />
                <span className="flex-1 truncate text-sm font-medium text-gray-600">
                  {info.muscles}
                </span>
                <span className="shrink-0 text-xs font-semibold text-brand-600">How to</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                    showHow ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {showHow && (
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{info.howTo}</p>
              )}
            </div>
          ) : (
            <p className="min-w-0 flex-1 text-sm text-gray-400">
              Your own exercise — log it the way you do it.
            </p>
          )}
        </div>

        {lastEntry && !existing && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3">
            <History className="h-4 w-4 shrink-0 text-brand-600" />
            <p className="text-sm font-medium text-brand-800">
              Last time: {Number(lastEntry.weight_kg)} kg × {lastEntry.reps} × {lastEntry.sets}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <Stepper
            label="Weight"
            value={weight}
            onChange={setWeight}
            step={2.5}
            min={0}
            max={500}
            unit="kg"
            decimals={1}
          />
          <Stepper label="Reps" value={reps} onChange={setReps} step={1} min={1} max={100} />
          <Stepper label="Sets" value={sets} onChange={setSets} step={1} min={1} max={20} />
        </div>

        <div className="mt-4 rounded-2xl bg-panel px-5 py-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Volume</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">
            {volume.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {weight} kg × {reps} reps × {sets} sets
          </p>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-gray-600">
            RPE <span className="text-gray-400">(optional — how hard it felt)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRpe(null)}
              className={`h-11 w-11 rounded-xl text-sm font-semibold transition ${
                rpe === null ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              —
            </button>
            {RPE_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRpe(value)}
                className={`h-11 w-11 rounded-xl text-sm font-semibold tabular-nums transition ${
                  rpe === value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          {showNotes ? (
            <>
              <p className="mb-2 text-sm font-medium text-gray-600">Notes</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. felt strong, elbow a bit sore"
                className="w-full rounded-2xl border border-gray-300 bg-surface px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="flex items-center gap-2 py-2 font-medium text-brand-600"
            >
              <MessageSquarePlus className="h-5 w-5" />
              Add a note
            </button>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={async () => {
              setBusy(true)
              try {
                await onDelete()
                onClose()
              } catch {
                setError('Could not delete that entry.')
              } finally {
                setBusy(false)
              }
            }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-surface py-3.5 font-semibold text-red-600 active:scale-[0.98]"
          >
            <Trash2 className="h-5 w-5" />
            Delete this entry
          </button>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-gray-200 bg-surface px-5 py-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 text-base font-semibold text-white active:scale-[0.98] disabled:opacity-60"
        >
          {busy && <Loader2 className="h-5 w-5 animate-spin" />}
          {existing ? 'Save changes' : 'Save'}
        </button>
      </div>
    </Sheet>
  )
}
