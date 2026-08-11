import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import BottomNav from './BottomNav'
import InstallPrompt from './InstallPrompt'
import RestTimerBar from './RestTimerBar'

export default function Layout() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  if (!session) return <Navigate to="/auth" replace />

  return (
    <div className="pb-nav mx-auto min-h-svh w-full max-w-lg">
      <Outlet />
      <BottomNav />
      <RestTimerBar />
      <InstallPrompt />
    </div>
  )
}
