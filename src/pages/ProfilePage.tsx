import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Dumbbell, FileUp, LayoutGrid, LogOut, Pencil, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'
import InstallRow from '../components/InstallRow'
import ThemeToggle from '../components/ThemeToggle'
import type { Profile } from '../lib/types'

export default function ProfilePage() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeSplit, setActiveSplit] = useState<string | null>(null)
  // Latest weigh-in, the same source the Weight tab and calorie estimates read.
  const [currentWeight, setCurrentWeight] = useState<number | null>(null)

  useEffect(() => {
    if (!session) return
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setProfile(data))
    supabase
      .from('splits')
      .select('name')
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => setActiveSplit(data?.name ?? null))
    supabase
      .from('body_weights')
      .select('weight_kg')
      .order('logged_on', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setCurrentWeight(data ? Number(data.weight_kg) : null))
  }, [session])

  const stat = (value: number | null | undefined, unit: string, decimals = 0) =>
    value === null || value === undefined ? '—' : `${value.toFixed(decimals)} ${unit}`

  const start = profile?.starting_weight_kg != null ? Number(profile.starting_weight_kg) : null
  const goal = profile?.goal_weight_kg != null ? Number(profile.goal_weight_kg) : null
  const change = currentWeight !== null && start !== null ? currentWeight - start : null
  const toGoal = currentWeight !== null && goal !== null ? goal - currentWeight : null
  // "Good" is whichever direction the goal sits in — losing isn't universally progress.
  const movingToGoal =
    change !== null && goal !== null && start !== null
      ? Math.abs(currentWeight! - goal) < Math.abs(start - goal)
      : false

  return (
    <div>
      <PageHeader title="Profile" />

      <div className="px-5 pb-2 pt-2">
        <div className="rounded-2xl bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-50">
              <User className="h-7 w-7 text-brand-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-gray-900">
                {profile?.name || 'Your account'}
              </p>
              <p className="truncate text-sm text-gray-500">{session?.user.email}</p>
            </div>
            <button
              onClick={() => navigate('/profile/edit')}
              aria-label="Edit profile"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 active:scale-95"
            >
              <Pencil className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-1.5 border-t border-gray-100 pt-4">
            {[
              { label: 'Height', value: stat(profile?.height_cm, 'cm'), highlight: false },
              { label: 'Starting', value: stat(profile?.starting_weight_kg, 'kg', 1), highlight: false },
              { label: 'Current', value: stat(currentWeight, 'kg', 1), highlight: true },
              { label: 'Goal', value: stat(profile?.goal_weight_kg, 'kg', 1), highlight: false },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  {label}
                </p>
                <p
                  className={`mt-1 text-sm font-bold tabular-nums ${
                    highlight ? 'text-brand-600' : 'text-gray-900'
                  }`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          {change !== null && (
            <p className="mt-2 text-center text-xs font-medium text-gray-500">
              <span className={movingToGoal ? 'text-green-600' : 'text-gray-500'}>
                {change > 0 ? '+' : ''}
                {change.toFixed(1)} kg
              </span>{' '}
              since you started
              {toGoal !== null && ` · ${Math.abs(toGoal).toFixed(1)} kg to goal`}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3 px-5">
        <button
          onClick={() => navigate('/profile/splits')}
          className="flex w-full items-center gap-4 rounded-2xl bg-surface p-5 text-left shadow-sm active:scale-[0.99]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50">
            <LayoutGrid className="h-5 w-5 text-brand-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900">My splits</p>
            <p className="truncate text-sm text-gray-500">
              {activeSplit ? `Active: ${activeSplit}` : 'Set up your training plan'}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
        </button>

        <button
          onClick={() => navigate('/profile/exercises')}
          className="flex w-full items-center gap-4 rounded-2xl bg-surface p-5 text-left shadow-sm active:scale-[0.99]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50">
            <Dumbbell className="h-5 w-5 text-brand-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900">Exercise library</p>
            <p className="truncate text-sm text-gray-500">Browse and add your own exercises</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
        </button>

        <button
          onClick={() => navigate('/profile/import')}
          className="flex w-full items-center gap-4 rounded-2xl bg-surface p-5 text-left shadow-sm active:scale-[0.99]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50">
            <FileUp className="h-5 w-5 text-brand-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900">Import history</p>
            <p className="truncate text-sm text-gray-500">Paste past workouts from a spreadsheet</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
        </button>

        <InstallRow />

        <ThemeToggle />
      </div>

      <div className="mt-6 px-5">
        <button
          onClick={signOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-surface px-4 py-4 text-base font-semibold text-red-600 shadow-sm active:scale-[0.98]"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </div>
  )
}
