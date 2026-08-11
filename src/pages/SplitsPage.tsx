import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, LayoutGrid, Loader2, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import SubHeader from '../components/SubHeader'
import Sheet from '../components/Sheet'
import {
  SPLIT_TEMPLATES,
  createSplitFromTemplate,
  fetchExercises,
  fetchSplits,
} from '../lib/splits'
import type { SplitTemplate } from '../lib/splits'
import type { Exercise, Split } from '../lib/types'

export default function SplitsPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [splits, setSplits] = useState<Split[]>([])
  const [library, setLibrary] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [template, setTemplate] = useState<SplitTemplate | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [splitData, exerciseData] = await Promise.all([fetchSplits(), fetchExercises()])
      setSplits(splitData)
      setLibrary(exerciseData)
    } catch {
      setError('Could not load your splits.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setTemplate(null)
    setName('')
    setError('')
    setCreating(true)
  }

  const chooseTemplate = (chosen: SplitTemplate) => {
    setTemplate(chosen)
    setName(chosen.key === 'blank' ? '' : chosen.name)
  }

  const create = async () => {
    if (!session || !template || !name.trim()) return
    setBusy(true)
    setError('')
    try {
      const id = await createSplitFromTemplate(
        session.user.id,
        name.trim(),
        template,
        library,
        splits.length === 0,
      )
      setCreating(false)
      navigate(`/profile/splits/${id}`)
    } catch {
      setError('Could not create that split. Please try again.')
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

  return (
    <div>
      <SubHeader title="My splits" />

      <div className="px-5 py-5">
        {splits.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-surface px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
              <LayoutGrid className="h-7 w-7 text-brand-600" />
            </div>
            <p className="font-semibold text-gray-900">No splits yet</p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              A split is your weekly plan — which exercises you do on which day.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {splits.map((split) => {
              const exerciseCount = split.split_days.reduce(
                (sum, day) => sum + day.split_day_exercises.length,
                0,
              )
              return (
                <button
                  key={split.id}
                  onClick={() => navigate(`/profile/splits/${split.id}`)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-surface p-5 text-left shadow-sm active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-lg font-semibold text-gray-900">{split.name}</p>
                      {split.is_active && (
                        <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-green-700">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {split.split_days.length} day{split.split_days.length === 1 ? '' : 's'} ·{' '}
                      {exerciseCount} exercise{exerciseCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
                </button>
              )
            })}
          </div>
        )}

        <button
          onClick={openCreate}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.6} />
          New split
        </button>

        {error && !creating && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </div>

      <Sheet open={creating} title="New split" onClose={() => setCreating(false)}>
        <div className="px-5 py-4">
          <p className="mb-3 text-sm font-medium text-gray-600">Start from</p>
          <div className="space-y-2">
            {SPLIT_TEMPLATES.map((option) => (
              <button
                key={option.key}
                onClick={() => chooseTemplate(option)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 bg-surface p-4 text-left transition ${
                  template?.key === option.key
                    ? 'border-brand-600 ring-2 ring-brand-100'
                    : 'border-transparent shadow-sm'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{option.name}</p>
                  <p className="mt-0.5 text-sm text-gray-500">{option.blurb}</p>
                </div>
              </button>
            ))}
          </div>

          {template && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-gray-600">Name this split</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My PPL"
                className="w-full rounded-2xl border border-gray-300 bg-surface px-4 py-4 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              {template.days.length > 0 && (
                <p className="mt-3 text-sm text-gray-500">
                  Creates {template.days.length} day
                  {template.days.length === 1 ? '' : 's'}: {template.days.map((d) => d.name).join(', ')}.
                  You can change everything afterwards.
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-gray-200 bg-surface px-5 py-3">
          <button
            onClick={create}
            disabled={!template || !name.trim() || busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 text-base font-semibold text-white active:scale-[0.98] disabled:opacity-40"
          >
            {busy && <Loader2 className="h-5 w-5 animate-spin" />}
            Create split
          </button>
        </div>
      </Sheet>
    </div>
  )
}
