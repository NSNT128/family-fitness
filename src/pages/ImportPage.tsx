import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, FileUp, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import SubHeader from '../components/SubHeader'
import { formatLogDate } from '../lib/logs'
import { importWorkoutLogs, parseWorkoutText, type ImportSummary } from '../lib/importLogs'

export default function ImportPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ImportSummary | null>(null)

  const parsed = useMemo(() => parseWorkoutText(text), [text])

  const sessions = useMemo(() => new Set(parsed.rows.map((r) => r.logged_on)).size, [parsed.rows])
  const dates = useMemo(() => parsed.rows.map((r) => r.logged_on).sort(), [parsed.rows])
  const exercises = useMemo(
    () => [...new Set(parsed.rows.map((r) => r.exercise_name))],
    [parsed.rows],
  )

  const runImport = async () => {
    if (!session || parsed.rows.length === 0) return
    setBusy(true)
    setError('')
    try {
      const summary = await importWorkoutLogs(session.user.id, parsed.rows)
      setResult(summary)
    } catch {
      setError('Could not import. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <div>
        <SubHeader title="Import history" />
        <div className="px-5 py-6">
          <div className="flex flex-col items-center rounded-2xl bg-surface p-8 text-center shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">
              Imported {result.inserted} {result.inserted === 1 ? 'entry' : 'entries'}
            </p>
            {result.duplicates > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                {result.duplicates} already-logged {result.duplicates === 1 ? 'entry was' : 'entries were'} skipped.
              </p>
            )}
            {result.unmatched.length > 0 && (
              <p className="mt-3 max-w-xs text-xs text-gray-400">
                Not in your library yet (imported by name, PRs still tracked):{' '}
                {result.unmatched.join(', ')}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/history')}
            className="mt-4 w-full rounded-xl bg-brand-600 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 active:scale-[0.98]"
          >
            View history
          </button>
          <button
            onClick={() => {
              setResult(null)
              setText('')
            }}
            className="mt-3 w-full rounded-xl bg-gray-100 py-3.5 text-sm font-semibold text-gray-700 active:bg-gray-200"
          >
            Import more
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SubHeader title="Import history" />

      <div className="space-y-4 px-5 py-4">
        <div className="rounded-2xl bg-surface p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <FileUp className="h-4 w-4 text-brand-600" />
            <p className="font-semibold text-gray-900">Paste from your spreadsheet</p>
          </div>
          <p className="text-sm text-gray-500">
            In Google Sheets, select your workout-log rows, copy, and paste below. Headers and other
            tables are ignored — only rows starting with a date (e.g. 2026-07-20) are imported.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Columns: Date · Split · Exercise · Weight · Reps · Sets · Volume · RPE · Notes
          </p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="2026-07-20	Legs	Squat	40	7	3	840	8	Felt heavy"
          className="w-full rounded-2xl border border-gray-300 bg-surface p-4 font-mono text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
        )}

        {text.trim() !== '' && (
          <div className="rounded-2xl bg-surface p-5 shadow-sm">
            {parsed.rows.length > 0 ? (
              <>
                <p className="text-sm font-semibold text-gray-900">
                  {parsed.rows.length} {parsed.rows.length === 1 ? 'entry' : 'entries'} · {sessions}{' '}
                  {sessions === 1 ? 'session' : 'sessions'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {formatLogDate(dates[0])} → {formatLogDate(dates[dates.length - 1])}
                </p>
                <p className="mt-2 text-xs text-gray-400">{exercises.join(' · ')}</p>
                {parsed.invalid > 0 && (
                  <p className="mt-2 text-xs font-medium text-amber-800">
                    {parsed.invalid} dated {parsed.invalid === 1 ? 'row' : 'rows'} couldn't be read
                    (bad numbers or missing exercise) and will be skipped.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">
                No log rows found yet. Each row needs to start with a date like 2026-07-20.
              </p>
            )}
          </div>
        )}

        <button
          onClick={runImport}
          disabled={busy || parsed.rows.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 active:scale-[0.98] disabled:opacity-40"
        >
          {busy && <Loader2 className="h-5 w-5 animate-spin" />}
          {parsed.rows.length > 0 ? `Import ${parsed.rows.length}` : 'Import'}
        </button>
      </div>
    </div>
  )
}
