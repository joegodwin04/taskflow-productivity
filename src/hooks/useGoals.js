// useGoals.js — Goal tracking with progress via API
import { useState, useCallback, useEffect } from 'react'
import { fetchAPI } from '../utils/api'

export function useGoals(user) {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const data = await fetchAPI('/goals')
      setGoals(data)
    } catch (e) {
      console.error('Failed to fetch goals:', e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGoals()
  }, [fetchGoals])

  const addGoal = useCallback(async (data) => {
    try {
      const newGoal = await fetchAPI('/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: data.title.trim(),
          icon: data.icon || '🎯',
          color: data.color || '#7c6af7',
          target: Number(data.target) || 10,
          current: 0,
          unit: data.unit || '',
          dueDate: data.dueDate || '',
        })
      })
      setGoals(prev => [...prev, newGoal])
    } catch (e) {
      console.error('Failed to add goal:', e)
    }
  }, [])

  const increment = useCallback(async (id, by = 1) => {
    let previousGoals = goals
    let targetCurrent = 0
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        targetCurrent = Math.min(g.current + by, g.target)
        return { ...g, current: targetCurrent }
      }
      return g
    }))
    try {
      await fetchAPI(`/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ current: targetCurrent })
      })
    } catch (e) {
      console.error('Failed to update goal:', e)
      setGoals(previousGoals) // revert
    }
  }, [goals])

  const decrement = useCallback(async (id) => {
    let previousGoals = goals
    let targetCurrent = 0
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        targetCurrent = Math.max(g.current - 1, 0)
        return { ...g, current: targetCurrent }
      }
      return g
    }))
    try {
      await fetchAPI(`/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ current: targetCurrent })
      })
    } catch (e) {
      console.error('Failed to update goal:', e)
      setGoals(previousGoals) // revert
    }
  }, [goals])

  const deleteGoal = useCallback(async (id) => {
    const previousGoals = goals
    setGoals(prev => prev.filter(g => g.id !== id))
    try {
      await fetchAPI(`/goals/${id}`, { method: 'DELETE' })
    } catch (e) {
      console.error('Failed to delete goal:', e)
      setGoals(previousGoals) // revert
    }
  }, [goals])

  const getProgress = (goal) => goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0

  return { goals, loading, addGoal, increment, decrement, deleteGoal, getProgress }
}

