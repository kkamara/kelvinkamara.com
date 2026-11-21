'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const table of ['adminAgreements', 'adminAgreementTemplates']) {
        await queryInterface.sequelize.query(
          `ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
          { transaction },
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  async down() {
    throw new Error('Cannot safely reverse the agreement character set migration; restore a backup if necessary.');
  },
};
