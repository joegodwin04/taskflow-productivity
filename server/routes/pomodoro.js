// pomodoro.js — Routes for focus session tracking
import { Router } from 'express'
import { PomodoroSession, FocusSession } from '../models/index.js'
import protect from '../middleware/auth.js'

const router = Router()

// All routes require authentication
router.use(protect)

// GET /api/pomodoro/sessions — get session count and history for the user
router.get('/sessions', async (req, res) => {
  try {
    let record = await PomodoroSession.findOne({ where: { userId: req.user.id } })

    if (!record) {
      record = await PomodoroSession.create({ userId: req.user.id, sessionCount: 0 })
    }

    // Fetch total duration and history from new table
    const history = await FocusSession.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 10
    })

    const allSessions = await FocusSession.findAll({ where: { userId: req.user.id } })
    const totalDurationSeconds = allSessions.reduce((acc, curr) => acc + curr.durationSeconds, 0)

    res.json({ 
      sessionCount: record.sessionCount,
      totalDurationSeconds,
      history
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch sessions.' })
  }
})

// POST /api/pomodoro/complete — legacy route, increment session count (for backward compatibility if needed)
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

// POST /api/pomodoro/save-session — save an individual focus session with duration
router.post('/save-session', async (req, res) => {
  const { durationSeconds, completed } = req.body
  try {
    if (typeof durationSeconds !== 'number' || durationSeconds < 0) {
      return res.status(400).json({ message: 'Invalid duration.' })
    }

    // 1. Create the new granular record
    await FocusSession.create({
      userId: req.user.id,
      durationSeconds,
      completed: !!completed
    })

    // 2. Safely increment the legacy PomodoroSession count if fully completed
    let record = await PomodoroSession.findOne({ where: { userId: req.user.id } })
    if (!record) {
      record = await PomodoroSession.create({ userId: req.user.id, sessionCount: completed ? 1 : 0 })
    } else if (completed) {
      record.sessionCount += 1
      record.lastUpdated = new Date()
      await record.save()
    }

    // 3. Return updated stats
    const history = await FocusSession.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 10
    })
    const allSessions = await FocusSession.findAll({ where: { userId: req.user.id } })
    const totalDurationSeconds = allSessions.reduce((acc, curr) => acc + curr.durationSeconds, 0)

    res.json({
      sessionCount: record.sessionCount,
      totalDurationSeconds,
      history
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to save focus session.' })
  }
})

export default router

