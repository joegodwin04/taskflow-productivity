import { DataTypes } from 'sequelize'

export const up = async ({ context: queryInterface }) => {
  await queryInterface.createTable('Routines', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    text: { type: DataTypes.STRING, allowNull: false },
    priority: { type: DataTypes.ENUM('high', 'medium', 'low'), defaultValue: 'medium' },
    category: { type: DataTypes.ENUM('work', 'personal', 'health', 'learning', 'other'), defaultValue: 'other' },
    scheduleType: { type: DataTypes.STRING, defaultValue: 'daily' }, // 'daily', 'weekdays', 'weekly'
    scheduleDays: { type: DataTypes.JSON, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })

  await queryInterface.addIndex('Routines', ['userId'])

  await queryInterface.addColumn('Tasks', 'routineId', {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Routines', key: 'id' },
    onDelete: 'CASCADE'
  })
  
  await queryInterface.addColumn('Tasks', 'routineDate', {
    type: DataTypes.STRING, // Format: YYYY-MM-DD
    allowNull: true
  })

  await queryInterface.addColumn('Tasks', 'isMissed', {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  })
}

export const down = async ({ context: queryInterface }) => {
  await queryInterface.removeColumn('Tasks', 'isMissed')
  await queryInterface.removeColumn('Tasks', 'routineDate')
  await queryInterface.removeColumn('Tasks', 'routineId')
  await queryInterface.dropTable('Routines')
}
