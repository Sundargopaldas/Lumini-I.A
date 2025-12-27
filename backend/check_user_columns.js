const sequelize = require('./config/database');

async function checkColumns() {
  try {
    await sequelize.authenticate();
    console.log('Connection has use established successfully.');
    
    // For SQLite, use PRAGMA table_info
    // For MySQL/Postgres, use DESCRIBE or select from information_schema
    // Assuming SQLite based on previous context or typical local dev, but let's try a generic query or assume the dialect.
    // The code uses Sequelize, so we can inspect the model or run raw query.
    // If it's MySQL: DESCRIBE Users;
    // If it's SQLite: PRAGMA table_info(Users);
    
    // Let's try to detect dialect or just run a query that lists columns.
    const dialect = sequelize.getDialect();
    console.log('Dialect:', dialect);

    if (dialect === 'sqlite') {
        const [results] = await sequelize.query("PRAGMA table_info(Users);");
        console.log(results);
    } else {
        const [results] = await sequelize.query("DESCRIBE Users;");
        console.log(results);
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkColumns();
