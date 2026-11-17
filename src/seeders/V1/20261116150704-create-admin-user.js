'use strict';
const moment = require("moment-timezone");
const { faker, } = require('@faker-js/faker');
const { mysqlTimeFormat, } = require("../../utils/time");
const { encrypt, } = require("../../utils/tokens");
const config = require("../../config");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const pwd = encrypt(config.adminPassword || "secret");
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

      await queryInterface.insert(
        queryInterface.sequelize.models.user,
        'users',
        user,
        { transaction },
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
      await queryInterface.bulkDelete('users', null, { transaction, });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
