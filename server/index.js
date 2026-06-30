// index.js — Express server entry point
import dotenv from 'dotenv'
dotenv.config() // Load env vars before anything else

import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import { sequelize } from './models/index.js'
import { migrator } from './config/umzug.js'

// Import route files
import authRouter from './routes/auth.js'
import tasksRouter from './routes/tasks.js'
import habitsRouter from './routes/habits.js'
import goalsRouter from './routes/goals.js'
import pomodoroRouter from './routes/pomodoro.js'
import usersRouter from './routes/users.js'
import routinesRouter from './routes/routines.js'

// Connect to Database and sync models
await connectDB()
await migrator.up() // Runs all pending migrations automatically

const app = express()

// Middleware
const allowedOrigins = [
  'https://taskflow-productivity-one.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Render health checks, curl, Postman), explicitly allowed origins, or any local dev server
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true)
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API Routes
app.use('/api/auth', authRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/habits', habitsRouter)
app.use('/api/goals', goalsRouter)
app.use('/api/pomodoro', pomodoroRouter)
app.use('/api/users', usersRouter)
app.use('/api/routines', routinesRouter)

// Health Check
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'TaskFlow API Server is running successfully',
    version: '5.0.0',
    timestamp: new Date()
  })
})

// Root Route
app.get('/', (req, res) => {
  res.send('TaskFlow Backend is running 🚀')
})

// Start Server
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 TaskFlow server running on port ${PORT}`)
})