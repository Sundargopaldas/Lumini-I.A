const { Sequelize } = require('sequelize');
const path = require('path');

// Configuração do banco
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

async function clearSmtpConfig() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    // Limpar configurações SMTP antigas do banco
    const [results] = await sequelize.query(`
      DELETE FROM SystemConfigs 
      WHERE key IN ('SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SECURE', 'SMTP_FROM')
    `);

    console.log(`✅ ${results} configurações SMTP removidas do banco`);
    console.log('');
    console.log('🎯 Agora o sistema vai usar APENAS as variáveis de ambiente do Fly.io!');
    console.log('');
    console.log('📧 Configuração ativa:');
    console.log(`   EMAIL_HOST: ${process.env.EMAIL_HOST || 'N/A'}`);
    console.log(`   EMAIL_PORT: ${process.env.EMAIL_PORT || 'N/A'}`);
    console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || 'N/A'}`);
    console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM || 'N/A'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

clearSmtpConfig();
