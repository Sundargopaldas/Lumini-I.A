require('dotenv').config();
const { Sequelize } = require('sequelize');
const EmailService = require('./services/EmailService');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function testSMTP() {
  try {
    console.log('🔍 Verificando configuração SMTP...\n');
    
    // Verificar configuração no banco de dados
    const [results] = await sequelize.query(
      "SELECT key, value FROM \"SystemConfigs\" WHERE key LIKE 'SMTP%'"
    );
    
    console.log('📧 Configuração SMTP no banco:');
    results.forEach(row => {
      if (row.key === 'SMTP_PASS') {
        console.log(`  ${row.key}: ****** (oculto)`);
      } else {
        console.log(`  ${row.key}: ${row.value}`);
      }
    });
    
    if (results.length === 0) {
      console.log('  ⚠️  Nenhuma configuração SMTP encontrada no banco!');
      console.log('\n💡 Configure o SMTP em: Admin → Configurações do Sistema');
    } else {
      console.log('\n📬 Testando envio de email...');
      
      // Criar um usuário fake para teste
      const testUser = {
        id: 1,
        name: 'Administrador Lumini',
        email: 'admin@lumini.ai'
      };
      
      const testEmail = process.argv[2] || 'seu-email@exemplo.com';
      
      console.log(`   Enviando convite para: ${testEmail}`);
      
      await EmailService.sendInviteEmail(testUser, testEmail);
      
      console.log('✅ Email enviado com sucesso!');
      console.log('\n🔍 Verifique sua caixa de entrada e spam.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('\nDetalhes:', error);
    process.exit(1);
  }
}

testSMTP();
