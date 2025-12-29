const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);

async function reset() {
  try {
    // Reset id 2 (sundaragopaldas@gmail.com) to 'free'
    await sequelize.query("UPDATE Users SET plan = 'free' WHERE email = 'sundaragopaldas@gmail.com'");
    console.log("Plan reset to 'free' for sundaragopaldas@gmail.com");
    
    // Also reset id 7 (spencer) just in case
    await sequelize.query("UPDATE Users SET plan = 'free' WHERE email = 'escritorlcspencer@gmail.com'");
    console.log("Plan reset to 'free' for escritorlcspencer@gmail.com");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await sequelize.close();
  }
}

reset();
