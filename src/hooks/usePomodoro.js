// usePomodoro.js — Focus timer with work/break modes and session tracking via API
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAPI } from '../utils/api'

const WORK_SECS  = 25 * 60
const SHORT_SECS =  5 * 60
const LONG_SECS  = 15 * 60
const MODE_TIMES = { work: WORK_SECS, short: SHORT_SECS, long: LONG_SECS }

export function usePomodoro(user, showToast) {
  const storageKey = user ? `taskflow_pomodoro_${user.id}` : 'taskflow_pomodoro_guest'

  // Initialize state robustly from localStorage using timestamps
  const getInitialState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey))
      if (saved) {
        let currentLeft = saved.timeLeft !== undefined ? saved.timeLeft : WORK_SECS
        if (saved.running && saved.endTime) {
          currentLeft = Math.max(0, Math.floor((saved.endTime - Date.now()) / 1000))
        }
        return {
          mode: saved.mode || 'work',
          running: saved.running && currentLeft > 0,
          timeLeft: currentLeft,
          endTime: saved.endTime || null
        }
      }
    } catch (e) {
      console.warn('Failed to parse pomodoro state', e)
    }
    return { mode: 'work', running: false, timeLeft: WORK_SECS, endTime: null }
  }

  const [state, setState] = useState(getInitialState)
  const [sessions, setSessions] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [history, setHistory] = useState([])
  
  const isCompletingRef = useRef(false)

  // Sync state explicitly to localStorage only on meaningful actions (start, pause, switch)
  const saveStateToStorage = (newState) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        mode: newState.mode,
        running: newState.running,
        timeLeft: newState.timeLeft,
        endTime: newState.endTime
      }))
    } catch (e) {
      console.warn('Failed to save pomodoro state', e)
    }
  }

  const fetchPomodoro = useCallback(async () => {
    if (!user) {
      setSessions(0)
      setTotalDuration(0)
      setHistory([])
      return
    }
    try {
      const data = await fetchAPI('/pomodoro/sessions')
      setSessions(data.sessionCount || 0)
      setTotalDuration(data.totalDurationSeconds || 0)
      setHistory(data.history || [])
    } catch (e) {
      console.error('Failed to fetch pomodoro:', e)
    }
  }, [user])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPomodoro()
  }, [fetchPomodoro])

  // Timer Tick based on absolute System Time
  useEffect(() => {
    if (!state.running || !state.endTime) return
    const intervalId = setInterval(() => {
      const remaining = Math.max(0, Math.floor((state.endTime - Date.now()) / 1000))
      
      setState(prev => {
        // Prevent redundant state updates
        if (prev.timeLeft === remaining) return prev
        return { ...prev, timeLeft: remaining }
      })
    }, 500) // 500ms for more responsive UI sync
    return () => clearInterval(intervalId)
  }, [state.running, state.endTime])

  // Handle completion automatically when time hits 0
  useEffect(() => {
    if (state.running && state.timeLeft === 0 && !isCompletingRef.current) {
      isCompletingRef.current = true // Prevent duplicate fire
      
      const completeSession = async () => {
        const nextState = { ...state, running: false, endTime: null }
        setState(nextState)
        saveStateToStorage(nextState)

        if (state.mode === 'work') {
          const nextSessions = sessions + 1
          setSessions(nextSessions)
          
          try {
            const data = await fetchAPI('/pomodoro/save-session', {
              method: 'POST',
              body: JSON.stringify({ 
                durationSeconds: WORK_SECS, 
                completed: true 
              })
            })
            setSessions(data.sessionCount || 0)
            setTotalDuration(data.totalDurationSeconds || 0)
            setHistory(data.history || [])
            if (showToast) showToast('Focus session complete! Time for a break.', 'success')
          } catch (e) {
            console.error('Failed to save session:', e)
            setSessions(sessions) // revert
            if (showToast) showToast('Failed to save focus session', 'error')
          }

          // Auto-switch to short break
          const breakState = { mode: 'short', running: false, timeLeft: SHORT_SECS, endTime: null }
          setState(breakState)
          saveStateToStorage(breakState)
        } else {
          // Switch back to work mode after a break
          const workState = { mode: 'work', running: false, timeLeft: WORK_SECS, endTime: null }
          setState(workState)
          saveStateToStorage(workState)
        }
        
        isCompletingRef.current = false
      }
      
      completeSession()
    }
  }, [state.timeLeft, state.running, state.mode, sessions, showToast])

  const toggle = useCallback(() => {
    setState(prev => {
      const nextRunning = !prev.running
      const nextEndTime = nextRunning ? Date.now() + prev.timeLeft * 1000 : null
      const nextState = { ...prev, running: nextRunning, endTime: nextEndTime }
      saveStateToStorage(nextState)
      return nextState
    })
  }, [storageKey])

  const reset = useCallback(() => {
    setState(prev => {
      const nextState = { ...prev, running: false, endTime: null, timeLeft: MODE_TIMES[prev.mode] }
      saveStateToStorage(nextState)
      return nextState
    })
  }, [storageKey])

  const switchMode = useCallback((m) => {
    const nextState = { mode: m, running: false, endTime: null, timeLeft: MODE_TIMES[m] }
    setState(nextState)
    saveStateToStorage(nextState)
  }, [storageKey])

  const finishAndSave = useCallback(async () => {
    // We must manually read the current state directly to avoid stale closures if triggered oddly
    const { mode, timeLeft } = state
    
    // Immediately stop timer
    const stoppedState = { ...state, running: false, endTime: null }
    setState(stoppedState)
    saveStateToStorage(stoppedState)

    if (mode !== 'work') {
       const workState = { mode: 'work', running: false, endTime: null, timeLeft: WORK_SECS }
       setState(workState)
       saveStateToStorage(workState)
       return
    }

    const elapsed = WORK_SECS - timeLeft
    if (elapsed <= 0) return

    try {
      const data = await fetchAPI('/pomodoro/save-session', {
        method: 'POST',
        body: JSON.stringify({
          durationSeconds: elapsed,
          completed: false
        })
      })
      setSessions(data.sessionCount || 0)
      setTotalDuration(data.totalDurationSeconds || 0)
      setHistory(data.history || [])
      if (showToast) showToast('Session saved!', 'success')
      
      // Reset for next (auto-switch to break)
      const breakState = { mode: 'short', running: false, endTime: null, timeLeft: SHORT_SECS }
      setState(breakState)
      saveStateToStorage(breakState)
    } catch (e) {
      console.error('Failed to save manual session:', e)
      if (showToast) showToast('Failed to save session', 'error')
    }
  }, [state, showToast])

  const totalSecs = MODE_TIMES[state.mode]
  const progress  = 1 - state.timeLeft / totalSecs   // 0 → 1
  const mm = String(Math.floor(state.timeLeft / 60)).padStart(2, '0')
  const ss = String(state.timeLeft % 60).padStart(2, '0')

  return { 
    mode: state.mode, 
    timeLeft: state.timeLeft, 
    running: state.running, 
    sessions, 
    progress, mm, ss, 
    toggle, reset, switchMode, finishAndSave, 
    totalDuration, history,
    WORK_SECS, SHORT_SECS, LONG_SECS 
  }
}

