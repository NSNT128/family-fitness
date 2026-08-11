import type { ReactNode } from 'react'

export default function PageHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <header className="px-5 pb-2 pt-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="mt-1 text-gray-500">{subtitle}</p>}
    </header>
  )
}
