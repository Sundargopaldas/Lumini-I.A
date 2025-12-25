const sequelize = require('./config/database');

async function fix() {
  try {
    await sequelize.authenticate();
    console.log('Connected');
    
    // Add goalId column
    try {
        await sequelize.query("ALTER TABLE Transactions ADD COLUMN goalId INTEGER NULL;");
        console.log("Added goalId column");
    } catch (e) {
        console.log("Column goalId might already exist or error:", e.message);
    }
    
    // Add FK constraint
    // Note: Table name for Goal model is likely 'Goals'
    try {
        await sequelize.query("ALTER TABLE Transactions ADD CONSTRAINT fk_transactions_goal FOREIGN KEY (goalId) REFERENCES Goals(id) ON DELETE SET NULL ON UPDATE CASCADE;");
        console.log("Added FK constraint");
    } catch (e) {
         console.log("FK constraint might already exist or error:", e.message);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

fix();