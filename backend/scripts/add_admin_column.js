const sequelize = require('../config/database');

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');
        
        // Tenta adicionar a coluna
        try {
            await sequelize.query("ALTER TABLE Users ADD COLUMN isAdmin TINYINT(1) DEFAULT 0;");
            console.log('Column isAdmin added successfully');
        } catch (e) {
            // Ignora erro se coluna já existir (code 1060: Duplicate column name)
            if (e.original && e.original.errno === 1060) {
                console.log('Column isAdmin already exists.');
            } else {
                console.log('Error adding column (might exist):', e.message);
            }
        }
        
        // Define o usuário ID 1 como admin
        try {
            await sequelize.query("UPDATE Users SET isAdmin = 1 WHERE id = 1;");
            console.log('User ID 1 updated to Admin.');
        } catch (e) {
            console.error('Error updating user:', e.message);
        }

    } catch (error) {
        console.error('Fatal Error:', error);
    } finally {
        // Encerra processo
        process.exit();
    }
};

run();