'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('adminInvoices', 'stripeAttemptAt', {
        type: Sequelize.DATE, allowNull: true,
      }, { transaction });
      await queryInterface.addColumn('adminInvoices', 'stripeKeyFingerprint', {
        type: Sequelize.STRING(64), allowNull: true,
      }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('adminInvoices', 'stripeKeyFingerprint', { transaction });
      await queryInterface.removeColumn('adminInvoices', 'stripeAttemptAt', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
