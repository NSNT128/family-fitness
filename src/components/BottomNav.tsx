import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, Scale, Trophy, CalendarDays, User } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/log', label: 'Log', icon: Dumbbell },
  { to: '/weight', label: 'Weight', icon: Scale },
  { to: '/prs', label: 'PRs', icon: Trophy },
  { to: '/history', label: 'History', icon: CalendarDays },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav-safe fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-surface">
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 pb-2 pt-3 text-xs font-medium transition ${
                isActive ? 'text-brand-600' : 'text-gray-400'
              }`
            }
          >
            <Icon className="h-6 w-6" strokeWidth={2.2} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
