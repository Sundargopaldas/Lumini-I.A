const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Goal = sequelize.define('Goal', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  targetAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#a855f7', // Default purple
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
  },
});

User.hasMany(Goal, { foreignKey: 'userId' });
Goal.belongsTo(User, { foreignKey: 'userId' });

module.exports = Goal;
