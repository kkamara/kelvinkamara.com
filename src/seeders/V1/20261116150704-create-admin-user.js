'use strict';
const moment = require("moment-timezone");
const { mysqlTimeFormat, } = require("../../utils/time");
const { encrypt, } = require("../../utils/tokens");
const config = require("../../config");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      if (!config.adminPassword) {
        throw new Error("ADMIN_PASSWORD must be set before seeding the administrator.");
      }
      if (config.adminPassword.length < 6 || config.adminPassword.length > 20) {
        throw new Error("ADMIN_PASSWORD must be between 6 and 20 characters.");
      }
      const pwd = encrypt(config.adminPassword);
      const user = {
        email: "kamaracomputers@gmail.com",
        firstName: "Kel",
        lastName: "Kamara",
        password: pwd.hash,
        passwordSalt: pwd.salt,
        createdAt: moment()
          .utc()
          .format(mysqlTimeFormat),
        updatedAt: moment()
          .utc()
          .format(mysqlTimeFormat),
      };

      await queryInterface.bulkInsert(
        'users',
        [user],
        { transaction, logging: false },
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('users', { email: "kamaracomputers@gmail.com" }, { transaction, });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
