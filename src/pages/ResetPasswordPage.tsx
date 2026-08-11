import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Dumbbell, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function ResetPasswordPage() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('The two passwords don’t match.')
      return
    }
    setError('')
    setBusy(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) {
        setError(
          err.message.toLowerCase().includes('6 characters')
            ? 'Password needs at least 6 characters.'
            : 'Could not update your password. Your link may have expired — request a new one.',
        )
      } else {
        setDone(true)
        setTimeout(() => navigate('/', { replace: true }), 1600)
      }
    } finally {
      setBusy(false)
    }
  }

  const shell = (children: ReactNode) => (
    <div className="flex min-h-svh flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/25">
            <Dumbbell className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set a new password</h1>
        </div>
        {children}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  // The recovery link signs the user in with a temporary session. No session
  // means they reached this page without a valid link.
  if (!session) {
    return shell(
      <div className="rounded-2xl bg-surface p-6 text-center shadow-sm">
        <p className="font-semibold text-gray-900">This link is invalid or has expired</p>
        <p className="mt-1 text-sm text-gray-500">
          Reset links can only be used once and expire after a while. Request a fresh one.
        </p>
        <Link
          to="/auth"
          className="mt-5 block w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white active:scale-[0.98]"
        >
          Back to log in
        </Link>
      </div>,
    )
  }

  if (done) {
    return shell(
      <div className="rounded-2xl bg-surface p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <p className="font-semibold text-gray-900">Password updated</p>
        <p className="mt-1 text-sm text-gray-500">Taking you into the app…</p>
      </div>,
    )
  }

  const inputClass =
    'w-full rounded-xl border border-gray-300 bg-surface px-4 py-3.5 text-base ' +
    'placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200'

  return shell(
    <form onSubmit={submit} className="space-y-4">
      <input
        type="password"
        autoComplete="new-password"
        placeholder="New password (6+ characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputClass}
        required
        minLength={6}
      />
      <input
        type="password"
        autoComplete="new-password"
        placeholder="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className={inputClass}
        required
        minLength={6}
      />
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 active:scale-[0.98] disabled:opacity-60"
      >
        {busy && <Loader2 className="h-5 w-5 animate-spin" />}
        Update password
      </button>
    </form>,
  )
}
