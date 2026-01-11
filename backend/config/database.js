const { Sequelize } = require('sequelize');
const path = require('path');
// Explicitly load .env from root of backend
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const isProduction = process.env.NODE_ENV === 'production';

// Em produção, usar DATABASE_URL (PostgreSQL)
// Em desenvolvimento OU se não tiver DATABASE_URL, usar SQLite
const sequelize = process.env.DATABASE_URL
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

console.log(`>>> [DATABASE] Using ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'} database`);

module.exports = sequelize;
