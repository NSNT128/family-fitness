import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Dumbbell, Loader2, MailCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type Mode = 'signin' | 'signup' | 'forgot'

const friendlyError = (message: string): string => {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Wrong email or password. Please try again.'
  if (m.includes('already registered')) return 'That email already has an account. Try logging in instead.'
  if (m.includes('at least 6 characters')) return 'Password needs at least 6 characters.'
  if (m.includes('valid email')) return 'That doesn’t look like a valid email address.'
  if (m.includes('fetch')) return 'Couldn’t reach the server. Check your internet connection.'
  return message
}

export default function AuthPage() {
  const { session } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  if (session) return <Navigate to="/" replace />

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setSent(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() } },
        })
        if (err) setError(friendlyError(err.message))
      } else if (mode === 'forgot') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset`,
        })
        // Show the same confirmation whether or not the email exists — don't leak
        // which addresses have accounts.
        if (err && !err.message.toLowerCase().includes('rate')) setError(friendlyError(err.message))
        else setSent(true)
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (err) setError(friendlyError(err.message))
      }
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-gray-300 bg-surface px-4 py-3.5 text-base ' +
    'placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200'

  const subtitle =
    mode === 'signin'
      ? 'Welcome back! Log in to continue.'
      : mode === 'signup'
        ? 'Create your own private account.'
        : 'We’ll email you a link to reset it.'

  return (
    <div className="flex min-h-svh flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/25">
            <Dumbbell className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Family Fitness</h1>
          <p className="mt-1 text-gray-500">{subtitle}</p>
        </div>

        {mode === 'forgot' && sent ? (
          <div className="rounded-2xl bg-surface p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
              <MailCheck className="h-7 w-7 text-green-600" />
            </div>
            <p className="font-semibold text-gray-900">Check your email</p>
            <p className="mt-1 text-sm text-gray-500">
              If an account exists for {email.trim()}, we’ve sent a link to reset your password.
              It can take a minute to arrive.
            </p>
            <button
              onClick={() => switchMode('signin')}
              className="mt-5 w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 active:bg-gray-200"
            >
              Back to log in
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  required
                />
              )}
              <input
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
              {mode !== 'forgot' && (
                <input
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder={mode === 'signup' ? 'Choose a password (6+ characters)' : 'Password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  required
                  minLength={6}
                />
              )}

              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="block w-full text-right text-sm font-medium text-brand-600"
                >
                  Forgot password?
                </button>
              )}

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 transition active:scale-[0.98] disabled:opacity-60"
              >
                {busy && <Loader2 className="h-5 w-5 animate-spin" />}
                {mode === 'signin' ? 'Log in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
              </button>
            </form>

            <button
              type="button"
              onClick={() =>
                switchMode(mode === 'signin' || mode === 'forgot' ? 'signup' : 'signin')
              }
              className="mt-6 w-full py-2 text-center text-base font-medium text-brand-600"
            >
              {mode === 'signup' ? 'Already have an account? Log in' : 'New here? Create an account'}
            </button>
            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="mt-1 w-full py-1 text-center text-sm font-medium text-gray-500"
              >
                Back to log in
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
