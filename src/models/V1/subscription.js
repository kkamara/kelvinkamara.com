'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Subscription extends Model {
    static associate(models) {
      // Association with User table
      Subscription.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }

  Subscription.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      serviceName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Name of the service the client is subscribed to',
      },
      startDate: {
        type: DataTypes.DATETIME,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When the subscription started',
      },
      endDate: {
        type: DataTypes.DATETIME,
        allowNull: true,
        comment: 'When the subscription ended, null if still active',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the subscription is currently active',
      },
    },
    {
      sequelize,
      modelName: 'Subscription',
      tableName: 'subscriptions',
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          fields: ['userId'],
        },
        {
          fields: ['isActive'],
        },
        {
          fields: ['userId', 'isActive'],
        },
      ],
    },
  );

  return Subscription;
};
