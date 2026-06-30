import sequelize from '../config/db.js'
import User from './User.js'
import Task from './Task.js'
import Habit from './Habit.js'
import Goal from './Goal.js'
import PomodoroSession from './PomodoroSession.js'
import FocusSession from './FocusSession.js'
import Routine from './Routine.js'

// Define associations
User.hasMany(Task, { foreignKey: 'userId', onDelete: 'CASCADE' })
Task.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(Habit, { foreignKey: 'userId', onDelete: 'CASCADE' })
Habit.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(Goal, { foreignKey: 'userId', onDelete: 'CASCADE' })
Goal.belongsTo(User, { foreignKey: 'userId' })

User.hasOne(PomodoroSession, { foreignKey: 'userId', onDelete: 'CASCADE' })
PomodoroSession.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(FocusSession, { foreignKey: 'userId', onDelete: 'CASCADE' })
FocusSession.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(Routine, { foreignKey: 'userId', onDelete: 'CASCADE' })
Routine.belongsTo(User, { foreignKey: 'userId' })

Routine.hasMany(Task, { foreignKey: 'routineId', onDelete: 'CASCADE' })
Task.belongsTo(Routine, { foreignKey: 'routineId' })

export {
  sequelize,
  User,
  Task,
  Habit,
  Goal,
  PomodoroSession,
  FocusSession,
  Routine
}
