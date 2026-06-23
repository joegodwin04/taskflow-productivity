// pomodoro.js — Routes for focus session tracking
import { Router } from 'express'
import { PomodoroSession } from '../models/index.js'
import protect from '../middleware/auth.js'

const router = Router()

// All routes require authentication
router.use(protect)

// GET /api/pomodoro/sessions — get session count for the user
router.get('/sessions', async (req, res) => {
  try {
    let record = await PomodoroSession.findOne({ where: { userId: req.user.id } })

    if (!record) {
      record = await PomodoroSession.create({ userId: req.user.id, sessionCount: 0 })
    }

    res.json({ sessionCount: record.sessionCount })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch sessions.' })
  }
})

// POST /api/pomodoro/complete — increment session count
router.post('/complete', async (req, res) => {
  try {
    let record = await PomodoroSession.findOne({ where: { userId: req.user.id } })

    if (!record) {
      record = await PomodoroSession.create({ userId: req.user.id, sessionCount: 1 })
    } else {
      record.sessionCount += 1
      record.lastUpdated = new Date()
      await record.save()
    }

    res.json({ sessionCount: record.sessionCount })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to record session.' })
  }
})

export default router
