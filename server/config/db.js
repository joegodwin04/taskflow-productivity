// db.js — SQLite connection via Sequelize
import { Sequelize } from 'sequelize'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize Sequelize with SQLite dialect
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', '..', 'database.sqlite'),
  logging: false, // Set to console.log to see SQL queries
})

export const connectDB = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ SQLite database connected successfully via Sequelize')
  } catch (error) {
    console.error(`❌ SQLite connection error: ${error.message}`)
    process.exit(1)
  }
}

export default sequelize
