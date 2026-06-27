// Task.js — Sequelize model for TaskFlow tasks/todos
import { DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  text: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  priority: {
    type: DataTypes.ENUM('high', 'medium', 'low'),
    defaultValue: 'medium',
  },
  category: {
    type: DataTypes.ENUM('work', 'personal', 'health', 'learning', 'other'),
    defaultValue: 'other',
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] }
  ]
})

export default Task
