// FocusSession.js — Sequelize model for individual focus session tracking
import { DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

const FocusSession = sequelize.define('FocusSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  durationSeconds: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] }
  ]
})

export default FocusSession
