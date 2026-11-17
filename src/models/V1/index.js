'use strict';
const fs = require('node:fs');
const path = require('node:path');
const Sequelize = require('sequelize');
const process = require('node:process');
const basename = path.basename(__filename);
const config = require('../../config/index.js');
const { log, } = require('node:console');

const env = process.env.NODE_ENV || 'development';

let seqConfig;
try {
  seqConfig = require('../../../config.json')[env];
} catch (error) {
  console.error('Failed to load Sequelize configuration:', error);
  process.exit(1);
}

const db = {};

let sequelize;
let logging = false;

if ('production' !== config.nodeEnv) {
  logging = log;
}

const sequelizeOptions = {
     port: seqConfig.port || 3306,
     dialect: seqConfig.dialect, /* 'mysql' | 'postgres' | 'sqlite' | 'mariadb' */
     storage: seqConfig.storage || false, // when sqlite dialect
     define: {
        timestamps: false,
        paranoid: true,
     },
     logging,
     pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
     },
};

if (config.databaseURL) {
  sequelize = new Sequelize(config.databaseURL, sequelizeOptions);
} else {
  sequelize = new Sequelize(
    seqConfig.database,
    seqConfig.username,
    seqConfig.password,
    {
      ...sequelizeOptions,
      host: process.env.DB_HOST || seqConfig.host,
    },
  );
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
