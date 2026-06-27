// Habit.js — Sequelize model for TaskFlow habits with daily completions
import { DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

const Habit = sequelize.define('Habit', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: '⭐',
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#7c6af7',
  },
  // Map of date strings (YYYY-MM-DD) to boolean completion status
  completions: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] }
  ]
})

export default Habit
