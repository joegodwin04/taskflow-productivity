// PomodoroSession.js — Sequelize model for focus session tracking
import { DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

const PomodoroSession = sequelize.define('PomodoroSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true, // One session record per user
  },
  sessionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 },
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
})

export default PomodoroSession
