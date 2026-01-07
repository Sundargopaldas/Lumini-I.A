const sequelize = require('./config/database');
const SystemConfig = require('./models/SystemConfig');

async function debugPass() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const configs = await SystemConfig.findAll({
            where: {
                key: ['SMTP_PASS', 'SMTP_USER']
            }
        });

        console.log('\n--- Credentials Debug ---');
        configs.forEach(c => {
            if (c.key === 'SMTP_PASS') {
                console.log(`[SMTP_PASS] Length: ${c.value.length}`);
                console.log(`[SMTP_PASS] First char: '${c.value[0]}'`);
                console.log(`[SMTP_PASS] Last char: '${c.value[c.value.length - 1]}'`);
                console.log(`[SMTP_PASS] Has spaces? ${c.value.includes(' ') ? 'YES' : 'NO'}`);
                // Print char codes to detect hidden chars
                const codes = [];
                for(let i=0; i<c.value.length; i++) codes.push(c.value.charCodeAt(i));
                console.log(`[SMTP_PASS] Char codes: ${codes.join(',')}`);
            } else {
                console.log(`[${c.key}]: '${c.value}' (Length: ${c.value.length})`);
            }
        });
        console.log('-------------------------\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

debugPass();