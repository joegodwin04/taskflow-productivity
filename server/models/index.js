import sequelize from '../config/db.js'
import User from './User.js'
import Task from './Task.js'
import Habit from './Habit.js'
import Goal from './Goal.js'
import PomodoroSession from './PomodoroSession.js'

// Define associations
User.hasMany(Task, { foreignKey: 'userId', onDelete: 'CASCADE' })
Task.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(Habit, { foreignKey: 'userId', onDelete: 'CASCADE' })
Habit.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(Goal, { foreignKey: 'userId', onDelete: 'CASCADE' })
Goal.belongsTo(User, { foreignKey: 'userId' })

User.hasOne(PomodoroSession, { foreignKey: 'userId', onDelete: 'CASCADE' })
PomodoroSession.belongsTo(User, { foreignKey: 'userId' })

export {
  sequelize,
  User,
  Task,
  Habit,
  Goal,
  PomodoroSession
}
