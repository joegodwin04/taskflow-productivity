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
    const { name, email, password } = req.body
    console.log(`\n[SIGNUP] REQUEST RECEIVED — email: ${email}`)

    if (!name || !email || !password) {
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

    console.log(`[SIGNUP] EMAIL NOT FOUND — creating new user`)

    const otp = generateOTP()
    console.log(`[SIGNUP] OTP GENERATED: ${otp}`)
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 mins

    // Create user unverified
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      avatar: name.substring(0, 2).toUpperCase(),
      isVerified: false,
      verificationOtp: otp,
      verificationOtpExpires: otpExpires,
    })
    console.log(`[SIGNUP] OTP SAVED — userId: ${user.id}`)

    // Send email — non-fatal, user can use Resend OTP if it fails
    try {
      await sendOTP(user.email, otp, 'verification')
      console.log(`[SIGNUP] EMAIL SENT`)
    } catch (emailErr) {
      console.error(`[SIGNUP] EMAIL FAILED (non-fatal): ${emailErr.message}`)
    }

    console.log(`[SIGNUP] RESPONSE RETURNED — 201`)
    res.status(201).json({
      message: 'Signup successful. Please verify your email.',
      userId: user.id,
    })
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: error.errors.map(e => e.message).join(', ') })
    }
    console.error('Signup error:', error)
    res.status(500).json({ message: 'Server error during signup.' })
  }
})

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { userId, email, otp } = req.body

    const whereClause = userId ? { id: userId } : { email: email.toLowerCase() }
    const user = await User.findOne({ where: whereClause })

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified.' })
    }

    if (user.verificationOtp !== otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' })
    }
    
    if (new Date() > user.verificationOtpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' })
    }

    user.isVerified = true
    user.verificationOtp = null
    user.verificationOtpExpires = null
    await user.save()

    // Seed default workspace upon successful verification
    await seedWorkspaceForUser(user.id, false)

    const token = generateToken(user.id)

    res.json({
      message: 'Email verified successfully.',
      token,
      user: user.toSafeObject(),
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({ message: 'Server error during verification.' })
  }
})

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId, email } = req.body

    const whereClause = userId ? { id: userId } : { email: email?.toLowerCase() }
    const user = await User.findOne({ where: whereClause })

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified.' })
    }

    const otp = generateOTP()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000)

    user.verificationOtp = otp
    user.verificationOtpExpires = otpExpires
    await user.save()

    // Send real email via Nodemailer
    await sendOTP(user.email, otp, 'verification')

    res.json({ message: 'A new OTP has been sent to your email.' })
  } catch (error) {
    console.error('Resend OTP error:', error)
    res.status(500).json({ message: 'Server error while resending OTP.' })
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

    if (!user.isVerified && !user.isGuest) {
      return res.status(403).json({ message: 'Please verify your email before logging in.', requiresVerification: true, userId: user.id })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' })
    }

    // Ensure workspace is seeded
    await seedWorkspaceForUser(user.id, false)

    const token = generateToken(user.id, remember)

    res.json({
      token,
      user: user.toSafeObject(),
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login.' })
  }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    console.log(`\n[FORGOT-PASSWORD] REQUEST RECEIVED — email: ${email}`)

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' })
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } })

    if (!user) {
      // Don't leak whether the email exists
      console.log(`[FORGOT-PASSWORD] EMAIL NOT FOUND — returning generic success`)
      return res.json({ message: 'If an account exists, an OTP has been sent.' })
    }

    console.log(`[FORGOT-PASSWORD] EMAIL FOUND — userId: ${user.id}`)

    const otp = generateOTP()
    console.log(`[FORGOT-PASSWORD] OTP GENERATED: ${otp}`)
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000)
    user.resetPasswordOtp = otp
    user.resetPasswordOtpExpires = otpExpires
    await user.save()
    console.log(`[FORGOT-PASSWORD] OTP SAVED`)

    // Send email — non-fatal so frontend always gets success response
    try {
      await sendOTP(user.email, otp, 'reset')
      console.log(`[FORGOT-PASSWORD] EMAIL SENT`)
    } catch (emailErr) {
      console.error(`[FORGOT-PASSWORD] EMAIL FAILED (non-fatal): ${emailErr.message}`)
    }

    console.log(`[FORGOT-PASSWORD] RESPONSE RETURNED`)
    res.json({ message: 'If an account exists, an OTP has been sent.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ message: 'Server error.' })
  }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'All fields are required.' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' })
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } })

    if (!user || user.resetPasswordOtp !== otp || new Date() > user.resetPasswordOtpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' })
    }

    user.password = newPassword
    user.resetPasswordOtp = null
    user.resetPasswordOtpExpires = null
    await user.save()

    res.json({ message: 'Password reset successfully. You can now log in.' })
  } catch (error) {
    console.error('Reset password error:', error)
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
