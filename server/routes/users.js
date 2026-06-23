// users.js — Profile, notification, and billing management routes
import { Router } from 'express'
import { User } from '../models/index.js'
import protect from '../middleware/auth.js'

const router = Router()

// All routes require authentication
router.use(protect)

// PUT /api/users/profile — update user profile details
router.put('/profile', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    const { name, email, bio, password } = req.body

    if (name) user.name = name
    if (bio !== undefined) user.bio = bio
    if (name) user.avatar = name.substring(0, 2).toUpperCase()

    // Handle email change — check uniqueness
    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ where: { email: email.toLowerCase() } })
      if (emailExists) {
        return res.status(400).json({ message: 'This email is already in use by another account.' })
      }
      user.email = email
    }

    // Handle password change (the beforeUpdate hook will hash it)
    if (password && password !== '••••••••') {
      user.password = password
    }

    await user.save()

    res.json({ user: user.toSafeObject() })
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({ message: 'Failed to update profile.' })
  }
})

// PUT /api/users/notifications — update notification preferences
router.put('/notifications', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    const { push, email, weeklyReports, soundToggle } = req.body

    const notifications = user.notifications || {}
    if (push !== undefined) notifications.push = push
    if (email !== undefined) notifications.email = email
    if (weeklyReports !== undefined) notifications.weeklyReports = weeklyReports
    if (soundToggle !== undefined) notifications.soundToggle = soundToggle

    user.notifications = notifications
    user.changed('notifications', true)
    await user.save()

    res.json({ user: user.toSafeObject() })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to update notification settings.' })
  }
})

// PUT /api/users/upgrade — toggle premium status
router.put('/upgrade', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    user.premium = true
    await user.save()

    res.json({ user: user.toSafeObject() })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to upgrade account.' })
  }
})

export default router
