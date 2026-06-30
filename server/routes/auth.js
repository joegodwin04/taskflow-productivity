// auth.js — Authentication routes: signup, login, guest, me, and OTP verification
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { User, Task, Habit, Goal, PomodoroSession } from '../models/index.js'
import protect from '../middleware/auth.js'
import { sendOTP } from '../utils/email.js'

const router = Router()

// Generate JWT token
const generateToken = (id, remember = false) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: remember ? '30d' : '7d',
  })
}

// Generate a random 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

// Seed default workspace data for a new user
const seedWorkspaceForUser = async (userId, isDemo = false) => {
  const dateStr = (daysAgo = 0) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return d.toISOString().split('T')[0]
  }

  // Seed tasks
  const existingTasks = await Task.count({ where: { userId } })
  if (existingTasks === 0) {
    const defaultTasks = isDemo
      ? [
          { userId, text: 'Design high-fidelity dashboard hero', completed: true, priority: 'high', category: 'work', notes: 'Complete this before shipping v5.', completedAt: new Date() },
          { userId, text: 'Audit Stripe payment comparisons modal', completed: true, priority: 'medium', category: 'work', notes: 'Check all Pricing Card grids.', completedAt: new Date() },
          { userId, text: 'Structure multi-account scoped state keys', completed: false, priority: 'high', category: 'work', notes: 'Verify todos, habits, goals, pomodoros isolation.' },
          { userId, text: 'Complete productivity report print styles', completed: false, priority: 'medium', category: 'learning', notes: 'Test browser print-to-PDF formatting.' },
        ]
      : [
          { userId, text: '🚀 Welcome to TaskFlow! Complete your first task', completed: false, priority: 'high', category: 'other', notes: 'Click checkmark to complete!' },
          { userId, text: '⏱️ Complete a focus session in the Focus Timer tab', completed: false, priority: 'medium', category: 'learning', notes: 'Work for 25 minutes, then rest.' },
        ]
    await Task.bulkCreate(defaultTasks)
  }

  // Seed habits
  const existingHabits = await Habit.count({ where: { userId } })
  if (existingHabits === 0) {
    const demoCompletions7 = {}
    const demoCompletions3 = {}
    for (let i = 0; i < 7; i++) demoCompletions7[dateStr(i)] = true
    for (let i = 0; i < 3; i++) demoCompletions3[dateStr(i)] = true

    const defaultHabits = [
      { userId, name: 'Morning workout', icon: '💪', color: '#f43f5e', completions: isDemo ? demoCompletions7 : {} },
      { userId, name: 'Read 20 minutes', icon: '📚', color: '#f59e0b', completions: isDemo ? demoCompletions7 : {} },
      { userId, name: 'Drink 8 glasses', icon: '💧', color: '#22d3ee', completions: isDemo ? demoCompletions3 : {} },
    ]
    await Habit.bulkCreate(defaultHabits)
  }

  // Seed goals
  const existingGoals = await Goal.count({ where: { userId } })
  if (existingGoals === 0) {
    const defaultGoals = [
      { userId, title: 'Complete 50 tasks', icon: '🎯', color: '#7c6af7', target: 50, current: isDemo ? 45 : 0, unit: 'tasks' },
      { userId, title: 'Build 30-day streak', icon: '🔥', color: '#f59e0b', target: 30, current: isDemo ? 12 : 0, unit: 'days' },
      { userId, title: 'Focus sessions this month', icon: '⏱️', color: '#10b981', target: 20, current: isDemo ? 18 : 0, unit: 'sessions' },
    ]
    await Goal.bulkCreate(defaultGoals)
  }

  // Seed pomodoro sessions
  const existingPomo = await PomodoroSession.findOne({ where: { userId } })
  if (!existingPomo) {
    await PomodoroSession.create({ userId, sessionCount: isDemo ? 18 : 0 })
  }
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, securityQuestion, securityAnswer } = req.body
    console.log(`\nREQUEST RECEIVED`)

    if (!name || !email || !password || !securityQuestion || !securityAnswer) {
      return res.status(400).json({ message: 'Please fill in all required fields.' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' })
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' })
    }

    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } })
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' })
    }

    console.log(`EMAIL NOT FOUND`)

    // Create user verified
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      securityQuestion,
      securityAnswer,
      avatar: name.substring(0, 2).toUpperCase(),
      isVerified: true,
      verificationOtp: null,
      verificationOtpExpires: null,
    })

    console.log(`USER SAVED`)

    // Seed default workspace upon successful signup
    await seedWorkspaceForUser(user.id, false)

    const token = generateToken(user.id)

    console.log(`RESPONSE RETURNED`)
    res.status(201).json({
      message: 'Signup successful.',
      token,
      user: user.toSafeObject(),
    })
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: error.errors.map(e => e.message).join(', ') })
    }
    console.error('Signup error:', error.message)
    res.status(500).json({ message: 'Server error during signup.' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, remember } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Please fill in all required fields.' })
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } })

    if (!user) {
      return res.status(401).json({ message: 'No account found with this email. Please sign up!' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' })
    }

    const token = generateToken(user.id, remember)

    res.json({
      token,
      user: user.toSafeObject(),
    })
  } catch (error) {
    console.error('Login error:', error.message)
    res.status(500).json({ message: 'Server error during login.' })
  }
})

// POST /api/auth/forgot-password/step1
router.post('/forgot-password/step1', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' })
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } })
    if (!user) {
      // Don't leak whether the email exists. Return a fake security question.
      return res.json({ securityQuestion: 'What was the name of your first pet?' })
    }

    res.json({ securityQuestion: user.securityQuestion || 'What was the name of your first pet?' })
  } catch (error) {
    console.error('Forgot password step 1 error:', error.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

// POST /api/auth/forgot-password/step2
router.post('/forgot-password/step2', async (req, res) => {
  try {
    const { email, securityAnswer, newPassword } = req.body

    if (!email || !securityAnswer || !newPassword) {
      return res.status(400).json({ message: 'All fields are required.' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' })
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } })
    if (!user) {
      // To prevent brute forcing, just pretend it's wrong answer
      return res.status(400).json({ message: 'Incorrect security answer.' })
    }

    const isMatch = await user.compareSecurityAnswer(securityAnswer)
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect security answer.' })
    }

    user.password = newPassword
    await user.save()

    res.json({ message: 'Password reset successfully. You can now log in.' })
  } catch (error) {
    console.error('Forgot password step 2 error:', error.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

// POST /api/auth/guest
router.post('/guest', async (req, res) => {
  try {
    const randomId = Math.random().toString(36).substring(2, 10)
    const guestEmail = `guest_${randomId}@taskflow.io`

    const user = await User.create({
      name: 'Guest User',
      email: guestEmail,
      password: `guest-${randomId}-bypass`,
      bio: 'Productivity enthusiast and SaaS engineer. Building the future of automated workspaces.',
      avatar: 'GU',
      premium: true,
      isGuest: true,
      isVerified: true, // Guests are auto-verified
    })

    // Seed with demo data
    await seedWorkspaceForUser(user.id, true)

    const token = generateToken(user.id)

    res.status(201).json({
      token,
      user: user.toSafeObject(),
    })
  } catch (error) {
    console.error('Guest access error:', error)
    res.status(500).json({ message: 'Failed to enter guest mode.' })
  }
})

// GET /api/auth/me — get current user from JWT
router.get('/me', protect, async (req, res) => {
  try {
    res.json({ user: req.user })
  } catch (error) {
    console.error('Fetch user error:', error)
    res.status(500).json({ message: 'Failed to fetch user.' })
  }
})

export default router
