const sequelize = require('./config/database');
const SystemConfig = require('./models/SystemConfig');

async function checkConfig() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const configs = await SystemConfig.findAll({
            where: {
                key: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_SECURE']
            }
        });

        console.log('\n--- Current SMTP Config in DB ---');
        configs.forEach(c => {
            console.log(`[${c.key}]: '${c.value}'`);
        });
        console.log('---------------------------------\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkConfig();