import { Wrench } from 'lucide-react'

export default function SetupNeeded() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
        <Wrench className="h-8 w-8 text-amber-600" />
      </div>
      <h1 className="text-xl font-bold text-gray-900">Almost there — Supabase isn't connected yet</h1>
      <p className="mt-2 max-w-sm text-gray-500">
        The app needs your Supabase project URL and anon key. Follow the steps in{' '}
        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm">SETUP.md</code> to create the
        project and paste both values into <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm">.env.local</code>,
        then restart the app.
      </p>
    </div>
  )
}
