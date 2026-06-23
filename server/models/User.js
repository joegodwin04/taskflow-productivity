// User.js — Sequelize model for TaskFlow users
import { DataTypes } from 'sequelize'
import bcrypt from 'bcryptjs'
import sequelize from '../config/db.js'

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true, notEmpty: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bio: {
    type: DataTypes.STRING,
    defaultValue: 'SaaS Builder on TaskFlow.',
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: 'TF',
  },
  joinDate: {
    type: DataTypes.STRING,
    defaultValue: () => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  },
  // We store notifications as JSON
  notifications: {
    type: DataTypes.JSON,
    defaultValue: { push: true, email: true, weeklyReports: true, soundToggle: true },
  },
  premium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isGuest: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // OTP Verification Fields
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verificationOtp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  verificationOtpExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Forgot Password Fields
  resetPasswordOtp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetPasswordOtpExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12)
        user.password = await bcrypt.hash(user.password, salt)
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12)
        user.password = await bcrypt.hash(user.password, salt)
      }
    }
  }
})

// Compare entered password with stored bcrypt hash
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Strip password from JSON output
User.prototype.toSafeObject = function () {
  const obj = this.toJSON()
  delete obj.password
  delete obj.verificationOtp
  delete obj.resetPasswordOtp
  return obj
}

export default User
