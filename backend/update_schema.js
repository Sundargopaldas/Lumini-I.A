const sequelize = require('./config/database');
// Import only Transaction model to force update on it
const Transaction = require('./models/Transaction');

const updateSchema = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Force sync ONLY on Transaction table to add isRecurring
    // We avoid syncing all models to prevent 'Too many keys' error on Users table
    await Transaction.sync({ alter: true });
    
    console.log('Transaction table updated successfully (isRecurring added).');
    process.exit(0);
  } catch (error) {
    console.error('Unable to update database:', error);
    process.exit(1);
  }
};

updateSchema();