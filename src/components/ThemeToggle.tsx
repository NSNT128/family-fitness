import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import type { Theme } from '../contexts/ThemeContext'

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Auto', icon: Monitor },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm">
      <p className="mb-3 text-sm font-medium text-gray-600">Appearance</p>
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-100 p-1">
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const active = theme === value
          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              aria-pressed={active}
              className={`flex flex-col items-center gap-1 rounded-lg py-2.5 text-xs font-semibold transition ${
                active
                  ? 'bg-surface text-brand-600 shadow-sm'
                  : 'text-gray-500 active:bg-gray-200'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2.2} />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
