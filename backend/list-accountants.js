// Script para listar contadores cadastrados
require('dotenv').config();
const sequelize = require('./config/database');
const Accountant = require('./models/Accountant');
const User = require('./models/User');

async function listAccountants() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados\n');

    const accountants = await Accountant.findAll({
      include: [{
        model: User,
        attributes: ['id', 'email', 'username', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });

    if (accountants.length === 0) {
      console.log('❌ Nenhum contador encontrado no banco de dados.\n');
      console.log('💡 Para criar um contador:');
      console.log('   1. Crie uma conta normal em /register');
      console.log('   2. Vá em Marketplace → Tornar-me Contador');
      console.log('   3. Preencha os dados e envie\n');
    } else {
      console.log(`📋 ${accountants.length} contador(es) encontrado(s):\n`);
      
      accountants.forEach((acc, idx) => {
        console.log(`${idx + 1}. ${acc.name}`);
        console.log(`   Email: ${acc.email}`);
        console.log(`   CRC: ${acc.crc || 'Não informado'}`);
        console.log(`   Verificado: ${acc.verified ? 'Sim' : 'Não'}`);
        
        if (acc.User) {
          console.log(`   👤 Usuário vinculado:`);
          console.log(`      ID: ${acc.User.id}`);
          console.log(`      Email login: ${acc.User.email}`);
          console.log(`      Username: ${acc.User.username}`);
        } else {
          console.log(`   ⚠️  Sem usuário vinculado (não pode fazer login)`);
        }
        console.log('');
      });
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

listAccountants();
