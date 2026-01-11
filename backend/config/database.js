const { Sequelize } = require('sequelize');
const path = require('path');
// Explicitly load .env from root of backend
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const isProduction = process.env.NODE_ENV === 'production';

// Em produção, usar DATABASE_URL (PostgreSQL)
// Em desenvolvimento, usar SQLite (mais simples e rápido)
const sequelize = isProduction && process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../database.sqlite'),
      logging: false,
    });

console.log(`>>> [DATABASE] Using ${isProduction ? 'PostgreSQL (Production)' : 'SQLite (Development)'}`);

module.exports = sequelize;
