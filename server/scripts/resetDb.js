import { User } from '../models/index.js'
import sequelize from '../config/db.js'

async function resetDatabase() {
  try {
    console.log('Connecting to database...')
    await sequelize.authenticate()
    console.log('Database connected successfully.')

    console.log('Deleting all users (which cascades to tasks, habits, goals, pomodoros)...')
    const deletedUsers = await User.destroy({ where: {} })
    
    console.log(`Reset complete. Deleted ${deletedUsers} user records and all associated data.`)
    process.exit(0)
  } catch (error) {
    console.error('Failed to reset database:', error)
    process.exit(1)
  }
}

resetDatabase()
