// useHabits.js — Habit tracking with streaks and daily completions using API
import { useState, useCallback, useEffect } from 'react'
import { fetchAPI } from '../utils/api'

const today = () => new Date().toISOString().split('T')[0]

const dateStr = (daysAgo = 0) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

export function useHabits(user) {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHabits = useCallback(async () => {
    if (!user) {
      setHabits([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const data = await fetchAPI('/habits')
      setHabits(data)
    } catch (e) {
      console.error('Failed to fetch habits:', e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHabits()
  }, [fetchHabits])

  const addHabit = useCallback(async (data) => {
    try {
      const newHabit = await fetchAPI('/habits', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name.trim(),
          icon: data.icon || '⭐',
          color: data.color || '#7c6af7',
          completions: {},
        })
      })
      setHabits(prev => [...prev, newHabit])
    } catch (e) {
      console.error('Failed to add habit:', e)
    }
  }, [])

  const toggleHabit = useCallback(async (id, date = today()) => {
    let previousHabits = habits
    let targetCompletions = {}
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        targetCompletions = { ...h.completions, [date]: !h.completions[date] }
        return { ...h, completions: targetCompletions }
      }
      return h
    }))
    try {
      await fetchAPI(`/habits/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ completions: targetCompletions })
      })
    } catch (e) {
      console.error('Failed to toggle habit:', e)
      setHabits(previousHabits) // revert
    }
  }, [habits])

  const deleteHabit = useCallback(async (id) => {
    const previousHabits = habits
    setHabits(prev => prev.filter(h => h.id !== id))
    try {
      await fetchAPI(`/habits/${id}`, { method: 'DELETE' })
    } catch (e) {
      console.error('Failed to delete habit:', e)
      setHabits(previousHabits) // revert
    }
  }, [habits])

  // Calculate current streak (consecutive days ending today or yesterday)
  const getStreak = useCallback((habit) => {
    if (!habit || !habit.completions) return 0
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const d = dateStr(i)
      if (habit.completions[d]) streak++
      else if (i > 0) break
    }
    return streak
  }, [])

  // Get last N days as array of { date, label, done }
  const getLastNDays = useCallback((habit, n = 7) => {
    return Array.from({ length: n }, (_, i) => {
      const ago = n - 1 - i
      const d = dateStr(ago)
      const label = new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })
      return { date: d, label, done: !!(habit?.completions?.[d]) }
    })
  }, [])

  const completedToday = habits.filter(h => h.completions && h.completions[today()]).length
  const totalToday = habits.length
  const longestStreak = habits.reduce((max, h) => Math.max(max, getStreak(h)), 0)

  return {
    habits,
    loading,
    addHabit,
    toggleHabit,
    deleteHabit,
    getStreak,
    getLastNDays,
    completedToday,
    totalToday,
    longestStreak,
    today,
  }
}

