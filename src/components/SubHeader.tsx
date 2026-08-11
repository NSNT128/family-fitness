import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function SubHeader({ title, action }: { title: string; action?: ReactNode }) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-gray-200 bg-white/95 px-2 py-3 backdrop-blur">
      <button
        onClick={() => navigate(-1)}
        aria-label="Go back"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-700 active:bg-gray-100"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={2.4} />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-gray-900">{title}</h1>
      {action}
    </header>
  )
}
