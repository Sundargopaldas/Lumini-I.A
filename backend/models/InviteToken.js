const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InviteToken = sequelize.define('InviteToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  accountantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Accountants',
      key: 'id'
    }
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'InviteTokens',
  timestamps: true
});

module.exports = InviteToken;
