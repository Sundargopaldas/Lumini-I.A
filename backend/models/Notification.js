const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  accountantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Accountants',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'User who triggered the notification (optional)'
  },
  type: {
    type: DataTypes.ENUM(
      'new_client',
      'client_unlinked',
      'new_document',
      'new_transaction',
      'monthly_report',
      'invite_accepted',
      'system'
    ),
    allowNull: false,
    defaultValue: 'system'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data like clientId, documentId, etc.'
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    {
      fields: ['accountantId', 'read']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Definir associações
Notification.associate = (models) => {
  Notification.belongsTo(models.Accountant, {
    foreignKey: 'accountantId',
    as: 'accountant'
  });
  
  Notification.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'triggerUser'
  });
};

module.exports = Notification;
