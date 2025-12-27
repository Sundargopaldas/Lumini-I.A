const sequelize = require('./config/database');

async function addIEColumn() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');
        
        await sequelize.query("ALTER TABLE Invoices ADD COLUMN clientStateRegistration VARCHAR(255) DEFAULT NULL;");
        console.log('Added clientStateRegistration column to Invoices table.');
        
    } catch (error) {
        console.error('Error adding column:', error);
    } finally {
        await sequelize.close();
    }
}

addIEColumn();
