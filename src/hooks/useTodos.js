// useTodos.js — Custom hook for all todo state management with API
import { useState, useCallback, useMemo, useEffect } from 'react'
import { fetchAPI } from '../utils/api'

export const PRIORITIES = {
  high:   { label: 'High',   color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',   icon: '🔴' },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: '🟡' },
  low:    { label: 'Low',    color: '#22d3a5', bg: 'rgba(34,211,165,0.1)',   icon: '🟢' },
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

export const CATEGORIES = [
  { id: 'work',     label: 'Work',     icon: '💼', color: '#7c6af7' },
  { id: 'personal', label: 'Personal', icon: '🏠', color: '#22d3a5' },
  { id: 'health',   label: 'Health',   icon: '💪', color: '#f43f5e' },
  { id: 'learning', label: 'Learning', icon: '📚', color: '#f59e0b' },
  { id: 'other',    label: 'Other',    icon: '✨', color: '#38bdf8' },
]

export function useTodos(user) {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)

  const [filter, setFilter] = useState('all')       // all | active | completed
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('createdAt') // createdAt | dueDate | priority | alpha

  const fetchTodos = useCallback(async () => {
    if (!user) {
      setTodos([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const data = await fetchAPI('/tasks')
      setTodos(data)
    } catch (e) {
      console.error('Failed to fetch todos:', e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTodos()
  }, [fetchTodos])

  const addTodo = useCallback(async (data) => {
    try {
      const newTodo = await fetchAPI('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          text: data.text.trim(),
          priority: data.priority || 'medium',
          category: data.category || 'other',
          dueDate: data.dueDate || null,
          notes: data.notes || '',
        })
      })
      setTodos(prev => [newTodo, ...prev])
    } catch (e) {
      console.error('Failed to add todo:', e)
    }
  }, [])

  const toggleTodo = useCallback(async (id) => {
    let previousTodos = todos
    let targetCompleted = false
    setTodos(prev => prev.map(t => {
      if (t.id === id) {
        targetCompleted = !t.completed
        return { ...t, completed: targetCompleted, completedAt: targetCompleted ? new Date().toISOString() : null }
      }
      return t
    }))
    try {
      await fetchAPI(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: targetCompleted })
      })
    } catch (e) {
      console.error('Failed to toggle todo:', e)
      setTodos(previousTodos) // revert
    }
  }, [todos])

  const deleteTodo = useCallback(async (id) => {
    const previousTodos = todos
    setTodos(prev => prev.filter(t => t.id !== id))
    try {
      await fetchAPI(`/tasks/${id}`, { method: 'DELETE' })
    } catch (e) {
      console.error('Failed to delete todo:', e)
      setTodos(previousTodos) // revert
    }
  }, [todos])

  const updateTodo = useCallback(async (id, updates) => {
    const previousTodos = todos
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    try {
      await fetchAPI(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
    } catch (e) {
      console.error('Failed to update todo:', e)
      setTodos(previousTodos) // revert
    }
  }, [todos])

  const clearCompleted = useCallback(async () => {
    const previousTodos = todos
    setTodos(prev => prev.filter(t => !t.completed))
    try {
      // API requires a new endpoint or doing it one by one, wait, is there a clear-completed route?
      // Let's check: tasks.js doesn't have clear-completed out of the box in the previous version,
      // but I can delete them locally. Wait, the API routes I wrote did not have clear-completed.
      // So I will iterate and delete.
      const completedIds = todos.filter(t => t.completed).map(t => t.id)
      await Promise.all(completedIds.map(id => fetchAPI(`/tasks/${id}`, { method: 'DELETE' })))
    } catch (e) {
      console.error('Failed to clear completed:', e)
      setTodos(previousTodos) // revert
    }
  }, [todos])

  const reorderTodo = useCallback((fromIndex, toIndex) => {
    setTodos(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  const filteredTodos = useMemo(() => {
    let result = [...todos]

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.text.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      )
    }

    // Status filter
    if (filter === 'active') result = result.filter(t => !t.completed)
    if (filter === 'completed') result = result.filter(t => t.completed)

    // Category filter
    if (categoryFilter !== 'all') result = result.filter(t => t.category === categoryFilter)

    // Priority filter
    if (priorityFilter !== 'all') result = result.filter(t => t.priority === priorityFilter)

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate) - new Date(b.dueDate)
      }
      if (sortBy === 'alpha') return a.text.localeCompare(b.text)
      // createdAt (default)
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

    return result
  }, [todos, filter, categoryFilter, priorityFilter, searchQuery, sortBy])

  const stats = useMemo(() => {
    const total = todos.length
    const completed = todos.filter(t => t.completed).length
    const active = total - completed
    const overdue = todos.filter(t =>
      !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
    ).length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, active, overdue, completionRate }
  }, [todos])

  return {
    todos,
    loading,
    filteredTodos,
    stats,
    filter, setFilter,
    categoryFilter, setCategoryFilter,
    priorityFilter, setPriorityFilter,
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    clearCompleted,
    reorderTodo,
  }
}

