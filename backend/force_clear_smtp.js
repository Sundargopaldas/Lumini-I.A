// Script para forçar limpeza de SMTP do banco
const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

async function clearSmtp() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco');

    const [results] = await sequelize.query(`
      DELETE FROM SystemConfigs 
      WHERE key IN ('SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SECURE', 'SMTP_FROM')
    `);

    console.log(`✅ ${results} configurações SMTP removidas`);
    console.log('');
    console.log('🎯 Agora o sistema usa APENAS variáveis de ambiente:');
    console.log(`   EMAIL_HOST: ${process.env.EMAIL_HOST || 'N/A'}`);
    console.log(`   EMAIL_PORT: ${process.env.EMAIL_PORT || 'N/A'}`);
    console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || 'N/A'}`);
    console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM || 'N/A'}`);
    console.log('');
    console.log('✅ PRONTO! Teste o email de recuperação de senha agora!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

clearSmtp();
