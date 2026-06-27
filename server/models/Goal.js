// Goal.js — Sequelize model for TaskFlow goals with progress tracking
import { DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

const Goal = sequelize.define('Goal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: '🎯',
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#7c6af7',
  },
  target: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  current: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 },
  },
  unit: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  dueDate: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] }
  ]
})

export default Goal
