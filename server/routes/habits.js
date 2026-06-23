// habits.js — CRUD routes for habits with daily completion toggling
import { Router } from 'express'
import { Habit } from '../models/index.js'
import protect from '../middleware/auth.js'

const router = Router()

// All routes require authentication
router.use(protect)

// GET /api/habits — fetch all habits for the authenticated user
router.get('/', async (req, res) => {
  try {
    const habits = await Habit.findAll({ 
      where: { userId: req.user.id },
      order: [['createdAt', 'ASC']]
    })
    res.json(habits)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch habits.' })
  }
})

// POST /api/habits — create a new habit
router.post('/', async (req, res) => {
  try {
    const { name, icon, color } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Habit name is required.' })
    }

    const habit = await Habit.create({
      userId: req.user.id,
      name: name.trim(),
      icon: icon || '⭐',
      color: color || '#7c6af7',
    })

    res.status(201).json(habit)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to create habit.' })
  }
})

// PUT /api/habits/:id/toggle — toggle habit completion for a specific date
router.put('/:id/toggle', async (req, res) => {
  try {
    const { date } = req.body
    const targetDate = date || new Date().toISOString().split('T')[0]

    const habit = await Habit.findOne({ where: { id: req.params.id, userId: req.user.id } })

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found.' })
    }

    // Toggle the completion for the given date (JSON field in Sequelize)
    const completions = habit.completions || {}
    if (completions[targetDate]) {
      delete completions[targetDate]
    } else {
      completions[targetDate] = true
    }

    habit.completions = completions
    habit.changed('completions', true)
    await habit.save()
    
    res.json(habit)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to toggle habit.' })
  }
})

// DELETE /api/habits/:id — delete a habit
router.delete('/:id', async (req, res) => {
  try {
    const deletedCount = await Habit.destroy({ where: { id: req.params.id, userId: req.user.id } })

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Habit not found.' })
    }

    res.json({ message: 'Habit deleted.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to delete habit.' })
  }
})

export default router
