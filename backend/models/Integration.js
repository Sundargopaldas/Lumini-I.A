const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Integration = sequelize.define('Integration', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  provider: {
    type: DataTypes.STRING, // 'Nubank', 'Hotmart', 'YouTube'
    allowNull: false,
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING, // 'active', 'error'
    defaultValue: 'active',
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
  },
});

User.hasMany(Integration, { foreignKey: 'userId' });
Integration.belongsTo(User, { foreignKey: 'userId' });

module.exports = Integration;
