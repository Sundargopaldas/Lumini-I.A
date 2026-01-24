const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filepath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  accountantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Accountants',
      key: 'id'
    }
  },
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Documents',
  timestamps: true
});

// Definir relacionamentos (será configurado em associations.js ou app.js)
Document.associate = (models) => {
  Document.belongsTo(models.User, {
    foreignKey: 'clientId',
    as: 'client'
  });
  
  Document.belongsTo(models.Accountant, {
    foreignKey: 'accountantId',
    as: 'accountant'
  });
};

module.exports = Document;
