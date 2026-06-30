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
  // Security Questions Fields
  securityQuestion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  securityAnswer: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(user.password, salt)
      }
      if (user.securityAnswer) {
        const salt = await bcrypt.genSalt(10)
        user.securityAnswer = await bcrypt.hash(user.securityAnswer.toLowerCase().trim(), salt)
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(user.password, salt)
      }
      if (user.changed('securityAnswer')) {
        const salt = await bcrypt.genSalt(10)
        user.securityAnswer = await bcrypt.hash(user.securityAnswer.toLowerCase().trim(), salt)
      }
    }
  },
  indexes: [
    {
      unique: true,
      fields: ['email']
    }
  ]
})

// Compare entered password with stored bcrypt hash
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Compare entered security answer with stored bcrypt hash
User.prototype.compareSecurityAnswer = async function (candidateAnswer) {
  if (!this.securityAnswer) return false
  return bcrypt.compare(candidateAnswer.toLowerCase().trim(), this.securityAnswer)
}

// Strip password from JSON output
User.prototype.toSafeObject = function () {
  const obj = this.toJSON()
  delete obj.password
  delete obj.verificationOtp
  delete obj.resetPasswordOtp
  delete obj.securityAnswer
  return obj
}

export default User
