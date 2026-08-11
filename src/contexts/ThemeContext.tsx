import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'ff-theme'
const THEME_COLOR = { light: '#1b6ef5', dark: '#0f1420' }

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

const resolve = (theme: Theme): boolean => (theme === 'system' ? prefersDark() : theme === 'dark')

/** Apply the resolved theme to <html> and keep the PWA status-bar color in step. */
const apply = (theme: Theme) => {
  const dark = resolve(theme)
  document.documentElement.classList.toggle('dark', dark)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? THEME_COLOR.dark : THEME_COLOR.light)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system',
  )

  useEffect(() => {
    apply(theme)
  }, [theme])

  // When following the system, react to the OS flipping light/dark live.
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t)
    setThemeState(t)
  }, [])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
