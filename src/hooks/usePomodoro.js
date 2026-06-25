// usePomodoro.js — Focus timer with work/break modes and session tracking via API
import { useState, useEffect, useCallback } from 'react'
import { fetchAPI } from '../utils/api'

const WORK_SECS  = 25 * 60
const SHORT_SECS =  5 * 60
const LONG_SECS  = 15 * 60
const MODE_TIMES = { work: WORK_SECS, short: SHORT_SECS, long: LONG_SECS }

export function usePomodoro(user, showToast) {
  const [mode, setMode]       = useState('work')   // 'work' | 'short' | 'long'
  const [timeLeft, setTimeLeft] = useState(WORK_SECS)
  const [running, setRunning]   = useState(false)
  const [sessions, setSessions] = useState(0)

  const fetchPomodoro = useCallback(async () => {
    if (!user) {
      setSessions(0)
      return
    }
    try {
      const data = await fetchAPI('/pomodoro/sessions')
      setSessions(data.sessionCount || 0)
    } catch (e) {
      console.error('Failed to fetch pomodoro:', e)
    }
  }, [user])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPomodoro()
  }, [fetchPomodoro])

  // Countdown
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setTimeLeft(t => (t > 0 ? t - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [running])

  // Handle completion
  useEffect(() => {
    if (running && timeLeft === 0) {
      setTimeout(async () => {
        setRunning(false)
        if (mode === 'work') {
          const nextSessions = sessions + 1
          setSessions(nextSessions)
          
          try {
            await fetchAPI('/pomodoro/complete', {
              method: 'POST',
              body: JSON.stringify({ sessionCount: nextSessions })
            })
            if (showToast) showToast('Focus session complete! Time for a break.', 'success')
          } catch (e) {
            console.error('Failed to save session:', e)
            setSessions(sessions) // revert
            if (showToast) showToast('Failed to save focus session', 'error')
          }

          // Auto-switch to short break
          setMode('short')
          setTimeLeft(SHORT_SECS)
        } else {
          setMode('work')
          setTimeLeft(WORK_SECS)
        }
      }, 0)
    }
  }, [timeLeft, running, mode, sessions])

  const toggle    = useCallback(() => setRunning(r => !r), [])
  const reset     = useCallback(() => { setRunning(false); setTimeLeft(MODE_TIMES[mode]) }, [mode])
  const switchMode = useCallback((m) => { setRunning(false); setMode(m); setTimeLeft(MODE_TIMES[m]) }, [])

  const totalSecs = MODE_TIMES[mode]
  const progress  = 1 - timeLeft / totalSecs   // 0 → 1
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')

  return { mode, timeLeft, running, sessions, progress, mm, ss, toggle, reset, switchMode, WORK_SECS, SHORT_SECS, LONG_SECS }
}

