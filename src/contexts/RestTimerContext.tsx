import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  cancelDone,
  closeRunning,
  ensureNotifyPermission,
  fireDoneNow,
  scheduleDone,
  showRunning,
} from '../lib/notify'

interface RestTimerValue {
  active: boolean
  paused: boolean
  done: boolean
  secondsLeft: number
  totalSeconds: number
  start: (seconds: number) => void
  adjust: (delta: number) => void
  togglePause: () => void
  stop: () => void
}

const RestTimerContext = createContext<RestTimerValue | null>(null)

const LAST_KEY = 'ff-rest-last'

// Short double beep via WebAudio — created on a user gesture (start), so it's allowed to play.
function beep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const tone = (at: number) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g)
      g.connect(ctx.destination)
      o.type = 'sine'
      o.frequency.value = 880
      g.gain.setValueAtTime(0.0001, ctx.currentTime + at)
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + at + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.28)
      o.start(ctx.currentTime + at)
      o.stop(ctx.currentTime + at + 0.3)
    }
    tone(0)
    tone(0.4)
    setTimeout(() => ctx.close(), 1000)
  } catch {
    /* audio not available */
  }
}

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [active, setActive] = useState(false)
  const [paused, setPaused] = useState(false)
  const [done, setDone] = useState(false)

  // Absolute end timestamp keeps the countdown accurate even if the tab throttles.
  const endAt = useRef<number>(0)
  // Throttle how often the ongoing notification is refreshed from the tick.
  const lastNotify = useRef<number>(0)

  const finish = useCallback(() => {
    setSecondsLeft(0)
    setActive(false)
    setPaused(false)
    setDone(true)
    beep()
    navigator.vibrate?.([200, 100, 200])
    // Page reached zero while alive: clear the ongoing notification. If we're
    // backgrounded (but not frozen), surface the finish alert now; the scheduled
    // OS trigger covers the frozen case.
    void closeRunning()
    void cancelDone()
    if (document.visibilityState !== 'visible') void fireDoneNow()
  }, [])

  useEffect(() => {
    if (!active || paused) return
    const tick = () => {
      const left = Math.max(0, Math.round((endAt.current - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left <= 0) {
        finish()
        return
      }
      // Refresh the ongoing notification roughly every 10s while the page is alive.
      if (Date.now() - lastNotify.current > 9500) {
        lastNotify.current = Date.now()
        void showRunning(endAt.current, left)
      }
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [active, paused, finish])

  const start = useCallback((seconds: number) => {
    localStorage.setItem(LAST_KEY, String(seconds))
    endAt.current = Date.now() + seconds * 1000
    lastNotify.current = Date.now()
    setTotalSeconds(seconds)
    setSecondsLeft(seconds)
    setDone(false)
    setPaused(false)
    setActive(true)
    void (async () => {
      if (!(await ensureNotifyPermission())) return
      await showRunning(endAt.current, seconds)
      await scheduleDone(endAt.current)
    })()
  }, [])

  const adjust = useCallback(
    (delta: number) => {
      if (!active) return
      endAt.current += delta * 1000
      const left = Math.max(0, Math.round((endAt.current - Date.now()) / 1000))
      setSecondsLeft(left)
      setTotalSeconds((t) => Math.max(t, left))
      void (async () => {
        await cancelDone()
        await showRunning(endAt.current, left)
        await scheduleDone(endAt.current)
      })()
    },
    [active],
  )

  const togglePause = useCallback(() => {
    setPaused((p) => {
      if (p) {
        // resuming: rebuild the end time from what's left
        endAt.current = Date.now() + secondsLeft * 1000
        void showRunning(endAt.current, secondsLeft)
        void scheduleDone(endAt.current)
      } else {
        // pausing: the scheduled finish no longer matches, so drop it
        void cancelDone()
      }
      return !p
    })
  }, [secondsLeft])

  const stop = useCallback(() => {
    setActive(false)
    setPaused(false)
    setDone(false)
    setSecondsLeft(0)
    void cancelDone()
    void closeRunning()
  }, [])

  // The "Rest done" bar clears itself after a few seconds — no need to tap X.
  useEffect(() => {
    if (!done) return
    const t = setTimeout(stop, 5000)
    return () => clearTimeout(t)
  }, [done, stop])

  // Coming back to the app after a background finish: clear any stale notification.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !active) void closeRunning()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [active])

  return (
    <RestTimerContext.Provider
      value={{ active, paused, done, secondsLeft, totalSeconds, start, adjust, togglePause, stop }}
    >
      {children}
    </RestTimerContext.Provider>
  )
}

export function useRestTimer() {
  const ctx = useContext(RestTimerContext)
  if (!ctx) throw new Error('useRestTimer must be used within RestTimerProvider')
  return ctx
}

export const lastRestDuration = (): number => Number(localStorage.getItem(LAST_KEY)) || 90
