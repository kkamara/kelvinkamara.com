'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
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
        },
        startDate: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        endDate: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        deletedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      }, { transaction });

      // Create indexes for common queries
      await queryInterface.addIndex('subscriptions', ['userId'], {
        transaction,
      });
      await queryInterface.addIndex('subscriptions', ['isActive'], {
        transaction,
      });
      await queryInterface.addIndex('subscriptions', ['userId', 'isActive'], {
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('subscriptions', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
