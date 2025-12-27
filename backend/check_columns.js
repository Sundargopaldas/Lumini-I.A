const sequelize = require('./config/database');

async function checkColumns() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    const [results, metadata] = await sequelize.query("DESCRIBE Invoices;");
    console.log(results);
    
    await sequelize.close();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

checkColumns();
