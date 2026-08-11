import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { isSupabaseConfigured } from './lib/supabase'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { RestTimerProvider } from './contexts/RestTimerContext'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import LogPage from './pages/LogPage'
import LogDayPage from './pages/LogDayPage'
import WeightPage from './pages/WeightPage'
import HistoryPage from './pages/HistoryPage'
import PRPage from './pages/PRPage'
import ProfilePage from './pages/ProfilePage'
import ProfileEditPage from './pages/ProfileEditPage'
import SplitsPage from './pages/SplitsPage'
import SplitDetailPage from './pages/SplitDetailPage'
import ExerciseLibraryPage from './pages/ExerciseLibraryPage'
import ImportPage from './pages/ImportPage'
import CardioPage from './pages/CardioPage'
import ExerciseProgressPage from './pages/ExerciseProgressPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import RecoveryRedirect from './components/RecoveryRedirect'
import SetupNeeded from './pages/SetupNeeded'

export default function App() {
  if (!isSupabaseConfigured) return <SetupNeeded />

  return (
    <ThemeProvider>
      <AuthProvider>
        <RestTimerProvider>
        <BrowserRouter>
          <RecoveryRedirect />
          <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset" element={<ResetPasswordPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/log" element={<LogPage />} />
            <Route path="/log/:dayId" element={<LogDayPage />} />
            <Route path="/weight" element={<WeightPage />} />
            <Route path="/prs" element={<PRPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<ProfileEditPage />} />
            <Route path="/profile/splits" element={<SplitsPage />} />
            <Route path="/profile/splits/:id" element={<SplitDetailPage />} />
            <Route path="/profile/exercises" element={<ExerciseLibraryPage />} />
            <Route path="/profile/import" element={<ImportPage />} />
            <Route path="/cardio" element={<CardioPage />} />
            <Route path="/progress/:name" element={<ExerciseProgressPage />} />
          </Route>
          </Routes>
        </BrowserRouter>
        </RestTimerProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
