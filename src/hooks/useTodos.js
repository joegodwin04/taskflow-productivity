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

export function useTodos(user, showToast) {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)

  const [filter, setFilter] = useState('all')       // all | active | completed | trash | archive
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
      if (data.isRoutine) {
        await fetchAPI('/routines', {
          method: 'POST',
          body: JSON.stringify({
            text: data.text.trim(),
            priority: data.priority || 'medium',
            category: data.category || 'other',
            scheduleType: data.scheduleType || 'daily',
            scheduleDays: data.scheduleDays || null,
          })
        })
        // Fetch tasks again to run the sync logic and get the new routine instance
        await fetchTodos()
        if (showToast) showToast('Daily routine created', 'success')
      } else {
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
        if (showToast) showToast('Task added successfully', 'success')
      }
    } catch (e) {
      console.error('Failed to add todo:', e)
      if (showToast) showToast('Failed to add item', 'error')
    }
  }, [showToast, fetchTodos])

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
      if (showToast) showToast('Failed to sync task toggle', 'error')
    }
  }, [todos, showToast])

  const deleteTodo = useCallback(async (id) => {
    const previousTodos = todos
    setTodos(prev => prev.filter(t => t.id !== id))
    try {
      await fetchAPI(`/tasks/${id}`, { method: 'DELETE' })
      if (showToast) showToast('Task deleted permanently', 'success')
    } catch (e) {
      console.error('Failed to delete todo:', e)
      setTodos(previousTodos) // revert
      if (showToast) showToast('Failed to delete task', 'error')
    }
  }, [todos, showToast])

  const moveToTrash = useCallback(async (id) => {
    const previousTodos = todos
    setTodos(prev => prev.map(t => t.id === id ? { ...t, deletedAt: new Date().toISOString() } : t))
    try {
      await fetchAPI(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ deletedAt: new Date().toISOString() })
      })
      if (showToast) showToast('Task moved to trash', 'success')
    } catch (e) {
      console.error('Failed to move to trash:', e)
      setTodos(previousTodos) // revert
      if (showToast) showToast('Failed to move to trash', 'error')
    }
  }, [todos, showToast])

  const restoreTask = useCallback(async (id) => {
    const previousTodos = todos
    setTodos(prev => prev.map(t => t.id === id ? { ...t, deletedAt: null } : t))
    try {
      await fetchAPI(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ deletedAt: null })
      })
      if (showToast) showToast('Task restored successfully', 'success')
    } catch (e) {
      console.error('Failed to restore task:', e)
      setTodos(previousTodos) // revert
      if (showToast) showToast('Failed to restore task', 'error')
    }
  }, [todos, showToast])

  const archiveTask = useCallback(async (id) => {
    const previousTodos = todos
    setTodos(prev => prev.map(t => t.id === id ? { ...t, archivedAt: new Date().toISOString() } : t))
    try {
      await fetchAPI(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ archivedAt: new Date().toISOString() })
      })
      if (showToast) showToast('Task archived', 'success')
    } catch (e) {
      console.error('Failed to archive task:', e)
      setTodos(previousTodos)
      if (showToast) showToast('Failed to archive task', 'error')
    }
  }, [todos, showToast])

  const duplicateTask = useCallback(async (id) => {
    const target = todos.find(t => t.id === id)
    if (!target) return
    try {
      const newTodo = await fetchAPI('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          text: target.text + ' (Copy)',
          priority: target.priority,
          category: target.category,
          notes: target.notes,
        })
      })
      setTodos(prev => [newTodo, ...prev])
      if (showToast) showToast('Task duplicated', 'success')
    } catch (e) {
      console.error('Failed to duplicate task:', e)
      if (showToast) showToast('Failed to duplicate task', 'error')
    }
  }, [todos, showToast])

  const updateTodo = useCallback(async (id, updates) => {
    const previousTodos = todos
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    try {
      await fetchAPI(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      if (showToast) showToast('Task updated', 'success')
    } catch (e) {
      console.error('Failed to update todo:', e)
      setTodos(previousTodos) // revert
      if (showToast) showToast('Failed to update task', 'error')
    }
  }, [todos, showToast])

  const clearCompleted = useCallback(async () => {
    const previousTodos = todos
    setTodos(prev => prev.filter(t => !t.completed || t.deletedAt))
    try {
      await fetchAPI('/tasks/completed', { method: 'DELETE' })
      if (showToast) showToast('Completed tasks cleared', 'success')
    } catch (e) {
      console.error('Failed to clear completed:', e)
      setTodos(previousTodos) // revert
      if (showToast) showToast('Failed to clear completed tasks', 'error')
    }
  }, [todos, showToast])

  const emptyTrash = useCallback(async () => {
    const previousTodos = todos
    setTodos(prev => prev.filter(t => !t.deletedAt))
    try {
      await fetchAPI('/tasks/trash', { method: 'DELETE' })
      if (showToast) showToast('Trash emptied', 'success')
    } catch (e) {
      console.error('Failed to empty trash:', e)
      setTodos(previousTodos) // revert
      if (showToast) showToast('Failed to empty trash', 'error')
    }
  }, [todos, showToast])

  const reorderTodo = useCallback((fromIndex, toIndex) => {
    setTodos(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  const filteredTodos = useMemo(() => {
    let result = todos.filter(t => !t.routineId)

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.text.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      )
    }

    // Base filter: separate active/completed from trash & archive
    if (filter === 'trash') {
      result = result.filter(t => t.deletedAt)
    } else if (filter === 'archive') {
      result = result.filter(t => t.archivedAt && !t.deletedAt)
    } else {
      result = result.filter(t => !t.deletedAt && !t.archivedAt)
      
      // Status filter (only applied if not in trash/archive)
      if (filter === 'active') result = result.filter(t => !t.completed)
      if (filter === 'completed') result = result.filter(t => t.completed)
    }

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
    const activeTasks = todos.filter(t => !t.deletedAt && !t.archivedAt && !t.routineId)
    const total = activeTasks.length
    const completed = activeTasks.filter(t => t.completed).length
    const active = total - completed
    const overdue = activeTasks.filter(t =>
      !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
    ).length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, active, overdue, completionRate }
  }, [todos])

  const todaysRoutines = useMemo(() => {
    const pad = (n) => n.toString().padStart(2, '0')
    const d = new Date()
    const todayStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    return todos.filter(t => t.routineId && t.routineDate === todayStr && !t.deletedAt && !t.archivedAt)
  }, [todos])

  const routineStats = useMemo(() => {
    const total = todaysRoutines.length
    const completed = todaysRoutines.filter(t => t.completed).length
    const remaining = total - completed
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, remaining, completionRate }
  }, [todaysRoutines])

  const groupedRoutines = useMemo(() => {
    const allRoutineTasks = todos.filter(t => t.routineId && !t.deletedAt && !t.archivedAt)
    
    const groups = {}
    allRoutineTasks.forEach(t => {
      if (!groups[t.routineId]) {
        groups[t.routineId] = {
          routineId: t.routineId,
          text: t.text,
          priority: t.priority,
          category: t.category,
          instances: [],
          createdAt: t.createdAt,
        }
      }
      groups[t.routineId].instances.push(t)
    })
    
    const pad = (n) => n.toString().padStart(2, '0')
    const d = new Date()
    const todayStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    
    return Object.values(groups).map(group => {
      group.instances.sort((a, b) => {
        if (a.routineDate !== b.routineDate) {
          return new Date(b.routineDate) - new Date(a.routineDate)
        }
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
      
      const todaysInstance = group.instances.find(t => t.routineDate === todayStr)
      
      let streak = 0
      let currentDate = new Date()
      
      if (!todaysInstance?.completed) {
        currentDate.setDate(currentDate.getDate() - 1)
      }
      
      let streakActive = true
      for (let i = 0; i < 365 && streakActive; i++) {
        const dStr = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(currentDate.getDate())}`
        const inst = group.instances.find(t => t.routineDate === dStr)
        
        if (inst && inst.completed) {
          streak++
          currentDate.setDate(currentDate.getDate() - 1)
        } else {
          streakActive = false
        }
      }
      
      return {
        ...group,
        todaysInstance,
        streak,
        completedToday: !!todaysInstance?.completed,
      }
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [todos])

  return {
    todos,
    loading,
    filteredTodos,
    groupedRoutines,
    stats,
    todaysRoutines,
    routineStats,
    filter, setFilter,
    categoryFilter, setCategoryFilter,
    priorityFilter, setPriorityFilter,
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    addTodo,
    toggleTodo,
    deleteTodo,
    moveToTrash,
    restoreTask,
    archiveTask,
    duplicateTask,
    updateTodo,
    clearCompleted,
    emptyTrash,
    reorderTodo,
  }
}

