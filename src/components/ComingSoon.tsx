import type { LucideIcon } from 'lucide-react'

export default function ComingSoon({
  icon: Icon,
  phase,
  description,
}: {
  icon: LucideIcon
  phase: number
  description: string
}) {
  return (
    <div className="mx-5 mt-10 flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-surface px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
        <Icon className="h-7 w-7 text-brand-600" />
      </div>
      <p className="font-semibold text-gray-900">Coming in Phase {phase}</p>
      <p className="mt-1 max-w-xs text-sm text-gray-500">{description}</p>
    </div>
  )
}
