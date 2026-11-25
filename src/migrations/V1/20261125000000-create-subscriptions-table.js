'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subscriptions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      serviceName: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Name of the service the client is subscribed to',
      },
      startDate: {
        type: Sequelize.DATETIME,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When the subscription started',
      },
      endDate: {
        type: Sequelize.DATETIME,
        allowNull: true,
        comment: 'When the subscription ended, null if still active',
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the subscription is currently active',
      },
      createdAt: {
        type: Sequelize.DATETIME,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATETIME,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
      deletedAt: {
        type: Sequelize.DATETIME,
        allowNull: true,
      },
    });

    // Create indexes for common queries
    await queryInterface.addIndex('subscriptions', ['userId']);
    await queryInterface.addIndex('subscriptions', ['isActive']);
    await queryInterface.addIndex('subscriptions', ['userId', 'isActive']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('subscriptions');
  },
};
