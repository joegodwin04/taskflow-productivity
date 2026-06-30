import { DataTypes } from 'sequelize'

export const up = async ({ context: queryInterface }) => {
  await queryInterface.createTable('FocusSessions', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    durationSeconds: { type: DataTypes.INTEGER, allowNull: false },
    completed: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })

  await queryInterface.addIndex('FocusSessions', ['userId'])
}

export const down = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('FocusSessions')
}
