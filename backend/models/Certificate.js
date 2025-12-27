const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Certificate = sequelize.define('Certificate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  cnpj: {
    type: DataTypes.STRING,
    allowNull: false
  },
  razaoSocial: {
    type: DataTypes.STRING,
    allowNull: false
  },
  inscricaoMunicipal: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING, // In production, this should be encrypted!
    allowNull: false
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'error'),
    defaultValue: 'active'
  }
});

// Association
User.hasOne(Certificate, { foreignKey: 'userId' });
Certificate.belongsTo(User, { foreignKey: 'userId' });

module.exports = Certificate;
