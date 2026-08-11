import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import SubHeader from '../components/SubHeader'
import Stepper from '../components/Stepper'
import { formatLogDate, todayISO } from '../lib/logs'

export default function ProfileEditPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [height, setHeight] = useState<number | null>(null)
  const [startWeight, setStartWeight] = useState<number | null>(null)
  const [goalWeight, setGoalWeight] = useState<number | null>(null)
  const [weeklyGoal, setWeeklyGoal] = useState<number>(4)
  const [birthYear, setBirthYear] = useState<number | null>(null)
  // Current weight lives in body_weights, not on the profile: the Weight tab and
  // the calorie estimate already read the latest weigh-in, and a second copy on
  // the profile would drift out of step with it.
  const [currentWeight, setCurrentWeight] = useState<number | null>(null)
  const [weighedOn, setWeighedOn] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    ;(async () => {
      const [{ data }, { data: latest }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase
          .from('body_weights')
          .select('weight_kg, logged_on')
          .order('logged_on', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      if (data) {
        setName(data.name ?? '')
        setHeight(data.height_cm)
        setStartWeight(data.starting_weight_kg)
        setGoalWeight(data.goal_weight_kg)
        setWeeklyGoal(data.weekly_workout_goal ?? 4)
        setBirthYear(data.birth_year ?? null)
      }
      if (latest) {
        setCurrentWeight(Number(latest.weight_kg))
        setWeighedOn(latest.logged_on)
      }
      setLoading(false)
    })()
  }, [session])

  const save = async () => {
    if (!session) return
    setSaving(true)
    setError('')
    const base = {
      name: name.trim(),
      height_cm: height,
      starting_weight_kg: startWeight,
      goal_weight_kg: goalWeight,
      updated_at: new Date().toISOString(),
    }
    let { error: err } = await supabase
      .from('profiles')
      .update({ ...base, weekly_workout_goal: weeklyGoal, birth_year: birthYear })
      .eq('id', session.user.id)
    // If the Phase 8 columns haven't been migrated yet, still save the rest so
    // profile editing never breaks (42703 = undefined column).
    if (err && err.code === '42703') {
      ;({ error: err } = await supabase.from('profiles').update(base).eq('id', session.user.id))
    }
    // A changed current weight is recorded as today's weigh-in, so the Weight tab
    // and the calorie estimate pick it up straight away.
    if (!err && currentWeight !== null) {
      const { error: wErr } = await supabase
        .from('body_weights')
        .upsert(
          { user_id: session.user.id, logged_on: todayISO(), weight_kg: currentWeight },
          { onConflict: 'user_id,logged_on' },
        )
      if (wErr) err = wErr
    }

    setSaving(false)
    if (err) {
      setError('Could not save. Please try again.')
      return
    }
    navigate('/profile')
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
      <SubHeader title="Edit profile" />

      <div className="space-y-5 px-5 py-5">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-600">Name</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-2xl border border-gray-200 bg-surface px-4 py-4 text-base shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>

        <Stepper
          label="Height"
          value={height}
          onChange={setHeight}
          step={1}
          min={100}
          max={230}
          unit="cm"
          placeholder={170}
        />

        <Stepper
          label="Starting weight"
          value={startWeight}
          onChange={setStartWeight}
          step={0.5}
          min={30}
          max={300}
          unit="kg"
          decimals={1}
          placeholder={75}
        />

        <div>
          <Stepper
            label="Current weight"
            value={currentWeight}
            onChange={setCurrentWeight}
            step={0.5}
            min={30}
            max={300}
            unit="kg"
            decimals={1}
            placeholder={75}
          />
          <p className="mt-1.5 px-1 text-xs text-gray-400">
            {weighedOn
              ? `Last weigh-in ${formatLogDate(weighedOn)}. Changing this saves today's weigh-in.`
              : "Saved as today's weigh-in — it drives your Weight tab and calorie estimates."}
          </p>
        </div>

        <Stepper
          label="Goal weight"
          value={goalWeight}
          onChange={setGoalWeight}
          step={0.5}
          min={30}
          max={300}
          unit="kg"
          decimals={1}
          placeholder={70}
        />

        <div>
          <Stepper
            label="Weekly workout goal"
            value={weeklyGoal}
            onChange={(v) => setWeeklyGoal(v ?? 4)}
            step={1}
            min={1}
            max={14}
            unit="days"
          />
          <p className="mt-1.5 px-1 text-xs text-gray-400">
            How many days a week you aim to train — tracked on your Home screen.
          </p>
        </div>

        <div>
          <Stepper
            label="Birth year"
            value={birthYear}
            onChange={setBirthYear}
            step={1}
            min={1900}
            max={new Date().getFullYear()}
            placeholder={1990}
          />
          <p className="mt-1.5 px-1 text-xs text-gray-400">
            Used with your height and weight to estimate calories burned.
          </p>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
          Save
        </button>
      </div>
    </div>
  )
}
