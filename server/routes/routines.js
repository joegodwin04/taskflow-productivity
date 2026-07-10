// routines.js — CRUD routes for daily routines
import { Router } from 'express'
import { Routine } from '../models/index.js'
import protect from '../middleware/auth.js'

const router = Router()
router.use(protect)

// GET /api/routines — fetch all routines for the authenticated user
router.get('/', async (req, res) => {
  try {
    const routines = await Routine.findAll({ 
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    })
    res.json(routines)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch routines.' })
  }
})

// POST /api/routines — create a new routine
router.post('/', async (req, res) => {
  try {
    const { text, priority, category, scheduleType, scheduleDays } = req.body

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Routine text is required.' })
    }

    const routine = await Routine.create({
      userId: req.user.id,
      text: text.trim(),
      priority: priority || 'medium',
      category: category || 'other',
      scheduleType: scheduleType || 'daily',
      scheduleDays: scheduleDays || null,
    })

    res.status(201).json(routine)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to create routine.' })
  }
})

// PUT /api/routines/:id — update a routine
router.put('/:id', async (req, res) => {
  try {
    const routine = await Routine.findOne({ where: { id: req.params.id, userId: req.user.id } })

    if (!routine) {
      return res.status(404).json({ message: 'Routine not found.' })
    }

    if (req.body.text !== undefined) routine.text = req.body.text
    if (req.body.priority !== undefined) routine.priority = req.body.priority
    if (req.body.category !== undefined) routine.category = req.body.category
    if (req.body.scheduleType !== undefined) routine.scheduleType = req.body.scheduleType
    if (req.body.scheduleDays !== undefined) routine.scheduleDays = req.body.scheduleDays

    await routine.save()
    res.json(routine)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to update routine.' })
  }
})

// DELETE /api/routines/:id — delete a routine
router.delete('/:id', async (req, res) => {
  try {
    const deletedCount = await Routine.destroy({ where: { id: req.params.id, userId: req.user.id } })

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Routine not found.' })
    }

    res.json({ message: 'Routine deleted.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to delete routine.' })
  }
})

export default router
