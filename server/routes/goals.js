// goals.js — CRUD routes for goals with progress tracking
import { Router } from 'express'
import { Goal } from '../models/index.js'
import protect from '../middleware/auth.js'

const router = Router()

// All routes require authentication
router.use(protect)

// GET /api/goals — fetch all goals for the authenticated user
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.findAll({ 
      where: { userId: req.user.id },
      order: [['createdAt', 'ASC']]
    })
    res.json(goals)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch goals.' })
  }
})

// POST /api/goals — create a new goal
router.post('/', async (req, res) => {
  try {
    const { title, icon, color, target, unit, dueDate } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Goal title is required.' })
    }

    const goal = await Goal.create({
      userId: req.user.id,
      title: title.trim(),
      icon: icon || '🎯',
      color: color || '#7c6af7',
      target: Number(target) || 10,
      unit: unit || '',
      dueDate: dueDate || '',
    })

    res.status(201).json(goal)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to create goal.' })
  }
})

// PUT /api/goals/:id — update a goal (increment, decrement, or edit)
router.put('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } })

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found.' })
    }

    // Handle increment/decrement
    if (req.body.increment !== undefined) {
      goal.current = Math.min(goal.current + (req.body.increment || 1), goal.target)
    } else if (req.body.decrement !== undefined) {
      goal.current = Math.max(goal.current - 1, 0)
    }

    // Update other fields if provided
    if (req.body.title !== undefined) goal.title = req.body.title
    if (req.body.icon !== undefined) goal.icon = req.body.icon
    if (req.body.color !== undefined) goal.color = req.body.color
    if (req.body.target !== undefined) goal.target = req.body.target
    if (req.body.current !== undefined) goal.current = req.body.current
    if (req.body.unit !== undefined) goal.unit = req.body.unit
    if (req.body.dueDate !== undefined) goal.dueDate = req.body.dueDate

    await goal.save()
    res.json(goal)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to update goal.' })
  }
})

// DELETE /api/goals/:id — delete a goal
router.delete('/:id', async (req, res) => {
  try {
    const deletedCount = await Goal.destroy({ where: { id: req.params.id, userId: req.user.id } })

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Goal not found.' })
    }

    res.json({ message: 'Goal deleted.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to delete goal.' })
  }
})

export default router
