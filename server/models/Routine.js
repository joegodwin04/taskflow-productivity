import { DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

const Routine = sequelize.define('Routine', {
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
  priority: {
    type: DataTypes.ENUM('high', 'medium', 'low'),
    defaultValue: 'medium',
  },
  category: {
    type: DataTypes.ENUM('work', 'personal', 'health', 'learning', 'other'),
    defaultValue: 'other',
  },
  scheduleType: {
    type: DataTypes.STRING,
    defaultValue: 'daily',
  },
  scheduleDays: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] }
  ]
})

export default Routine
