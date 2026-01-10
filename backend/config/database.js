const { Sequelize } = require('sequelize');
const path = require('path');
// Explicitly load .env from root of backend
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: false,
      dialectOptions: process.env.NODE_ENV === 'production' ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      } : {}
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
        dialectOptions: process.env.NODE_ENV === 'production' ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        } : {}
      }
    );

module.exports = sequelize;
