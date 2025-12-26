const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Goal = require('./Goal');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true, // e.g., 'Hotmart', 'YouTube', 'Client'
  },
  type: {
    type: DataTypes.STRING, // 'income' or 'expense'
    allowNull: false,
    defaultValue: 'expense'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
  },
  categoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: Category,
      key: 'id',
    },
  },
  goalId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Goal,
      key: 'id',
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
});

User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

Category.hasMany(Transaction, { foreignKey: 'categoryId' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId' });

Goal.hasMany(Transaction, { foreignKey: 'goalId' });
Transaction.belongsTo(Goal, { foreignKey: 'goalId' });

module.exports = Transaction;