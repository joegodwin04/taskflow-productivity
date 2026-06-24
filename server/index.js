// index.js — Express server entry point
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import { sequelize } from './models/index.js' // This ensures associations are loaded

// Import route files
import authRouter from './routes/auth.js'
import tasksRouter from './routes/tasks.js'
import habitsRouter from './routes/habits.js'
import goalsRouter from './routes/goals.js'
import pomodoroRouter from './routes/pomodoro.js'
import usersRouter from './routes/users.js'
import { verifySmtp } from './utils/email.js'

// Load environment variables
dotenv.config()

// Connect to Database and sync models
await connectDB()
await sequelize.sync() // Creates tables if they don't exist

const app = express()

// Middleware
const allowedOrigins = [
  'https://taskflow-productivity-ijr5.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
]
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Render health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`))
    }
  },
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API Routes mounting
app.use('/api/auth', authRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/habits', habitsRouter)
app.use('/api/goals', goalsRouter)
app.use('/api/pomodoro', pomodoroRouter)
app.use('/api/users', usersRouter)

// Base API Status endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'TaskFlow API Server is running successfully',
    version: '5.0.0',
    timestamp: new Date()
  })
})

// Listen on configured port
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 TaskFlow server running in development mode on port ${PORT}`)
  // Verify SMTP connection after server starts
  verifySmtp()
})
