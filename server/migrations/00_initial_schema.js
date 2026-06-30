import { DataTypes } from 'sequelize'

export const up = async ({ context: queryInterface }) => {
  await queryInterface.createTable('Users', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    bio: { type: DataTypes.STRING, defaultValue: 'SaaS Builder on TaskFlow.' },
    avatar: { type: DataTypes.STRING, defaultValue: 'TF' },
    joinDate: { type: DataTypes.STRING },
    notifications: { type: DataTypes.JSON },
    premium: { type: DataTypes.BOOLEAN, defaultValue: false },
    isGuest: { type: DataTypes.BOOLEAN, defaultValue: false },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    verificationOtp: { type: DataTypes.STRING, allowNull: true },
    verificationOtpExpires: { type: DataTypes.DATE, allowNull: true },
    resetPasswordOtp: { type: DataTypes.STRING, allowNull: true },
    resetPasswordOtpExpires: { type: DataTypes.DATE, allowNull: true },
    securityQuestion: { type: DataTypes.STRING, allowNull: true },
    securityAnswer: { type: DataTypes.STRING, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })

  await queryInterface.createTable('Tasks', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    text: { type: DataTypes.STRING, allowNull: false },
    completed: { type: DataTypes.BOOLEAN, defaultValue: false },
    priority: { type: DataTypes.ENUM('high', 'medium', 'low'), defaultValue: 'medium' },
    category: { type: DataTypes.ENUM('work', 'personal', 'health', 'learning', 'other'), defaultValue: 'other' },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.STRING, defaultValue: '' },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
    archivedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })

  await queryInterface.addIndex('Tasks', ['userId'])

  await queryInterface.createTable('Habits', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    name: { type: DataTypes.STRING, allowNull: false },
    icon: { type: DataTypes.STRING, defaultValue: '⭐' },
    color: { type: DataTypes.STRING, defaultValue: '#7c6af7' },
    completions: { type: DataTypes.JSON },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })

  await queryInterface.addIndex('Habits', ['userId'])

  await queryInterface.createTable('Goals', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    title: { type: DataTypes.STRING, allowNull: false },
    icon: { type: DataTypes.STRING, defaultValue: '🎯' },
    color: { type: DataTypes.STRING, defaultValue: '#7c6af7' },
    target: { type: DataTypes.INTEGER, allowNull: false },
    current: { type: DataTypes.INTEGER, defaultValue: 0 },
    unit: { type: DataTypes.STRING, defaultValue: '' },
    dueDate: { type: DataTypes.STRING, defaultValue: '' },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })

  await queryInterface.addIndex('Goals', ['userId'])

  await queryInterface.createTable('PomodoroSessions', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    sessionCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastUpdated: { type: DataTypes.DATE },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })
}

export const down = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('PomodoroSessions')
  await queryInterface.dropTable('Goals')
  await queryInterface.dropTable('Habits')
  await queryInterface.dropTable('Tasks')
  await queryInterface.dropTable('Users')
}
