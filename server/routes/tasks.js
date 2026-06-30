// tasks.js — CRUD routes for tasks/todos
import { Router } from 'express'
import { Op } from 'sequelize'
import { Task, Routine } from '../models/index.js'
import protect from '../middleware/auth.js'

const router = Router()

// All routes require authentication
router.use(protect)

// Helper: sync routines to generate missing tasks
const syncRoutines = async (userId) => {
  const routines = await Routine.findAll({ where: { userId } })
  if (routines.length === 0) return

  // Get last 14 days (including today)
  const today = new Date()
  const dates = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    // local YYYY-MM-DD
    const pad = (n) => n.toString().padStart(2, '0')
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    dates.push(dateStr)
  }

  const todayStr = dates[0]

  // Find existing routine instances in this window
  const existingTasks = await Task.findAll({
    where: { 
      userId, 
      routineId: routines.map(r => r.id),
      // we don't strictly filter by date here, filtering in memory is fine for small limits
    }
  })

  const newTasksToCreate = []

  for (const routine of routines) {
    for (const dateStr of dates) {
      // Check if it should run
      const dUtc = new Date(dateStr + 'T12:00:00Z')
      const dayOfWeek = dUtc.getUTCDay() // 0=Sun, 1=Mon...
      
      let shouldRun = false
      if (routine.scheduleType === 'daily') shouldRun = true
      else if (routine.scheduleType === 'weekdays') shouldRun = (dayOfWeek >= 1 && dayOfWeek <= 5)
      else if (routine.scheduleType === 'weekly' && Array.isArray(routine.scheduleDays)) {
        shouldRun = routine.scheduleDays.includes(dayOfWeek)
      }

      if (!shouldRun) continue

      // Check if task exists
      const exists = existingTasks.some(t => t.routineId === routine.id && t.routineDate === dateStr)
      
      if (!exists) {
        newTasksToCreate.push({
          userId,
          text: routine.text,
          priority: routine.priority,
          category: routine.category,
          routineId: routine.id,
          routineDate: dateStr,
          isMissed: dateStr !== todayStr,
          completed: false,
          dueDate: dateStr === todayStr ? new Date() : new Date(dateStr + 'T23:59:59Z')
        })
      }
    }
  }

  if (newTasksToCreate.length > 0) {
    await Task.bulkCreate(newTasksToCreate)
  }
}

// GET /api/tasks — fetch all tasks for the authenticated user
router.get('/', async (req, res) => {
  try {
    await syncRoutines(req.user.id)

    const tasks = await Task.findAll({ 
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    })
    res.json(tasks)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch tasks.' })
  }
})

// POST /api/tasks — create a new task
router.post('/', async (req, res) => {
  try {
    const { text, priority, category, dueDate, notes } = req.body

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Task text is required.' })
    }

    const task = await Task.create({
      userId: req.user.id,
      text: text.trim(),
      priority: priority || 'medium',
      category: category || 'other',
      dueDate: dueDate || null,
      notes: notes || '',
    })

    res.status(201).json(task)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to create task.' })
  }
})

// PUT /api/tasks/:id — update a task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id } })

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' })
    }

    // Handle toggle completed
    if (req.body.completed !== undefined) {
      if (task.isMissed) {
        return res.status(400).json({ message: 'Cannot complete a missed routine.' })
      }
      task.completed = req.body.completed
      task.completedAt = req.body.completed ? new Date() : null
    }

    // Update other fields if provided
    if (req.body.text !== undefined) task.text = req.body.text
    if (req.body.priority !== undefined) task.priority = req.body.priority
    if (req.body.category !== undefined) task.category = req.body.category
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate
    if (req.body.notes !== undefined) task.notes = req.body.notes
    
    // Handle soft delete / restore
    if (req.body.deletedAt !== undefined) task.deletedAt = req.body.deletedAt

    // Handle archive / unarchive
    if (req.body.archivedAt !== undefined) task.archivedAt = req.body.archivedAt

    await task.save()
    res.json(task)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to update task.' })
  }
})

// DELETE /api/tasks/completed — clear all completed tasks
router.delete('/completed', async (req, res) => {
  try {
    await Task.destroy({ where: { userId: req.user.id, completed: true } })
    const remaining = await Task.findAll({ 
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    })
    res.json(remaining)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to clear completed tasks.' })
  }
})

// DELETE /api/tasks/trash — empty all trashed tasks
router.delete('/trash', async (req, res) => {
  try {
    await Task.destroy({ where: { userId: req.user.id, deletedAt: { [Op.ne]: null } } })
    const remaining = await Task.findAll({ 
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    })
    res.json(remaining)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to empty trash.' })
  }
})

// DELETE /api/tasks/:id — delete a single task
router.delete('/:id', async (req, res) => {
  try {
    const deletedCount = await Task.destroy({ where: { id: req.params.id, userId: req.user.id } })

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Task not found.' })
    }

    res.json({ message: 'Task deleted.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to delete task.' })
  }
})

export default router
