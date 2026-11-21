'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const id = { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false };
      const clientId = { type: Sequelize.INTEGER, allowNull: false, references: { model: 'adminClients', key: 'id' } };
      const timestamps = {
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      };
      await queryInterface.createTable('adminClients', {
        id, firstName: { type: Sequelize.STRING(100), allowNull: false },
        lastName: { type: Sequelize.STRING(100), allowNull: false },
        email: { type: Sequelize.STRING(254), allowNull: false },
        company: { type: Sequelize.STRING(200), allowNull: false, defaultValue: '' },
        phone: { type: Sequelize.STRING(50), allowNull: false, defaultValue: '' },
        notes: { type: Sequelize.TEXT, allowNull: false }, ...timestamps,
      }, { transaction });
      await queryInterface.createTable('adminInvoices', {
        id, clientId, description: { type: Sequelize.TEXT, allowNull: false },
        amountPence: { type: Sequelize.INTEGER, allowNull: false },
        dueDate: { type: Sequelize.DATEONLY, allowNull: false },
        paymentInstructions: { type: Sequelize.TEXT, allowNull: false },
        paymentLink: { type: Sequelize.STRING(2048), allowNull: false, defaultValue: '' },
        stripeRequestKey: { type: Sequelize.STRING(36), allowNull: false },
        ...timestamps,
      }, { transaction });
      await queryInterface.createTable('adminAgreements', {
        id, clientId, title: { type: Sequelize.STRING(200), allowNull: false },
        body: { type: Sequelize.TEXT('long'), allowNull: false },
        signed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        ...timestamps,
      }, { transaction });
      await queryInterface.createTable('adminPayments', {
        id, clientId, invoiceId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'adminInvoices', key: 'id' } },
        amountPence: { type: Sequelize.INTEGER, allowNull: false },
        paidDate: { type: Sequelize.DATEONLY, allowNull: false },
        method: { type: Sequelize.STRING(100), allowNull: false },
        details: { type: Sequelize.TEXT, allowNull: false }, ...timestamps,
      }, { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const table of ['adminPayments', 'adminAgreements', 'adminInvoices', 'adminClients']) {
        await queryInterface.dropTable(table, { transaction });
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
