const sequelize = require('./config/database');
const SystemConfig = require('./models/SystemConfig');

async function fixConfig() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Fix SMTP_HOST
        await SystemConfig.update(
            { value: 'smtp.gmail.com' },
            { where: { key: 'SMTP_HOST' } }
        );

        console.log('Fixed SMTP_HOST to "smtp.gmail.com"');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

fixConfig();