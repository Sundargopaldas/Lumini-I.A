const sequelize = require('./backend/config/database');
const User = require('./backend/models/User');
const Accountant = require('./backend/models/Accountant');
const bcrypt = require('./backend/node_modules/bcryptjs');

// Manually load env vars
try {
    require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
} catch (e) {
    console.log('⚠️ Dotenv not found, assuming env vars are loaded or defaults work.');
}

async function setupDemo() {
    try {
        await sequelize.authenticate();
        console.log('🔌 Conectado ao banco de dados.');

        const commonPassword = 'lumini123';
        const hashedPassword = await bcrypt.hash(commonPassword, 10);

        // 1. Setup ACCOUNTANT (Spencer)
        const accountantEmail = 'sundaragopaldas@gmail.com';
        let accountantUser = await User.findOne({ where: { email: accountantEmail } });
        
        if (!accountantUser) {
            console.error('❌ Accountant User not found!');
            return;
        }

        // Reset Password
        accountantUser.password = hashedPassword;
        accountantUser.accountantId = null; // Ensure he is not linked as a client to anyone
        await accountantUser.save();
        
        // Ensure Accountant Profile exists and is Verified
        let accountantProfile = await Accountant.findOne({ where: { userId: accountantUser.id } });
        if (!accountantProfile) {
             console.log('⚠️ Accountant Profile missing, creating one...');
             accountantProfile = await Accountant.create({
                 name: 'Spencer Contabilidade',
                 email: accountantEmail,
                 userId: accountantUser.id,
                 verified: true,
                 crc: 'SP-123456/O-0',
                 specialty: 'Demo Specialist',
                 description: 'Conta de demonstração.'
             });
        } else {
            accountantProfile.verified = true;
            await accountantProfile.save();
        }

        // 2. Setup CLIENT (Demo Client)
        const clientEmail = 'cliente_demo@teste.com';
        let clientUser = await User.findOne({ where: { email: clientEmail } });

        if (!clientUser) {
            console.log('Creating new Demo Client...');
            clientUser = await User.create({
                name: 'Cliente Demo',
                username: 'clientedemo', // Added username
                email: clientEmail,
                password: hashedPassword,
                role: 'user',
                plan: 'premium',
                accountantId: accountantProfile.id // Link directly to Spencer
            });
        } else {
            console.log('Updating existing Demo Client...');
            clientUser.password = hashedPassword;
            clientUser.plan = 'premium';
            clientUser.accountantId = accountantProfile.id; // Ensure link
            await clientUser.save();
        }

        console.log('\n✅ AMBIENTE DE DEMONSTRAÇÃO CONFIGURADO COM SUCESSO! ✅');
        console.log('===========================================================');
        console.log('🧑‍💼 CONTA DE CONTADOR:');
        console.log(`   Email: ${accountantEmail}`);
        console.log(`   Senha: ${commonPassword}`);
        console.log('   (Use esta conta para ver seus clientes)');
        console.log('-----------------------------------------------------------');
        console.log('🧑‍💻 CONTA DE CLIENTE:');
        console.log(`   Email: ${clientEmail}`);
        console.log(`   Senha: ${commonPassword}`);
        console.log('   (Use esta conta para ver o Marketplace e o vínculo)');
        console.log('===========================================================');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await sequelize.close();
    }
}

setupDemo();
