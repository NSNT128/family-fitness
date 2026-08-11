import type { LucideIcon } from 'lucide-react'

const TONES = {
  brand: { icon: 'text-brand-600', bg: 'bg-brand-50' },
  orange: { icon: 'text-orange-500', bg: 'bg-orange-50' },
} as const

export default function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'brand',
  muted = false,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  sub?: string
  tone?: keyof typeof TONES
  muted?: boolean
}) {
  const t = TONES[tone]
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${t.bg}`}>
        <Icon className={`h-5 w-5 ${muted ? 'text-gray-300' : t.icon}`} strokeWidth={2.2} />
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {sub && <span className="text-sm font-medium text-gray-400">{sub}</span>}
      </div>
    </div>
  )
}
