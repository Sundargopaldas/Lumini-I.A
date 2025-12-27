const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Invoice = sequelize.define('Invoice', {
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
  clientName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  clientDocument: {
    type: DataTypes.STRING,
    allowNull: true // CPF/CNPJ
  },
  clientStateRegistration: {
    type: DataTypes.STRING,
    allowNull: true
  },
  clientEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  clientAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  serviceDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('issued', 'processing', 'cancelled', 'error'),
    defaultValue: 'processing'
  },
  issueDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  externalReference: {
    type: DataTypes.STRING,
    allowNull: true // ID from Stripe/Hotmart
  }
});

// Association
User.hasMany(Invoice, { foreignKey: 'userId' });
Invoice.belongsTo(User, { foreignKey: 'userId' });

module.exports = Invoice;
