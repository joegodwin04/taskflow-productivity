// tasks.js — CRUD routes for tasks/todos
import { Router } from 'express'
import { Task } from '../models/index.js'
import protect from '../middleware/auth.js'

const router = Router()

// All routes require authentication
router.use(protect)

// GET /api/tasks — fetch all tasks for the authenticated user
router.get('/', async (req, res) => {
  try {
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
      task.completed = req.body.completed
      task.completedAt = req.body.completed ? new Date() : null
    }

    // Update other fields if provided
    if (req.body.text !== undefined) task.text = req.body.text
    if (req.body.priority !== undefined) task.priority = req.body.priority
    if (req.body.category !== undefined) task.category = req.body.category
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate
    if (req.body.notes !== undefined) task.notes = req.body.notes

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
