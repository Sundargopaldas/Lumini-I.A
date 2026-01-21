require('dotenv').config();
const { Sequelize } = require('sequelize');
const nodemailer = require('nodemailer');

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

async function diagnoseEmail() {
  try {
    console.log('🔍 === DIAGNÓSTICO COMPLETO DO SISTEMA DE EMAIL ===\n');

    // 1. Verificar configuração no banco de dados
    console.log('📊 1. VERIFICANDO BANCO DE DADOS:');
    const [dbConfigs] = await sequelize.query(
      "SELECT key, value FROM \"SystemConfigs\" WHERE key LIKE 'SMTP%' OR key LIKE 'EMAIL%'"
    );

    if (dbConfigs.length > 0) {
      console.log('   ✅ Configurações encontradas no banco:');
      dbConfigs.forEach(row => {
        if (row.key.includes('PASS')) {
          console.log(`      ${row.key}: ****** (oculto)`);
        } else {
          console.log(`      ${row.key}: ${row.value}`);
        }
      });
    } else {
      console.log('   ⚠️  Nenhuma configuração no banco de dados');
    }

    // 2. Verificar variáveis de ambiente
    console.log('\n📋 2. VERIFICANDO VARIÁVEIS DE AMBIENTE:');
    const envVars = {
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS ? '****** (configurado)' : '❌ NÃO CONFIGURADO',
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_SECURE: process.env.EMAIL_SECURE
    };

    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`   ${value ? '✅' : '❌'} ${key}: ${value || '❌ NÃO CONFIGURADO'}`);
    });

    // 3. Tentar criar transporter
    console.log('\n🔧 3. TESTANDO CONEXÃO SMTP:');
    
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!host || !user || !pass) {
      console.log('   ❌ ERRO: Configurações SMTP incompletas!');
      console.log('\n💡 SOLUÇÃO: Configure as variáveis com:');
      console.log('   fly secrets set EMAIL_HOST=smtp.gmail.com --app lumini-i-a');
      console.log('   fly secrets set EMAIL_PORT=587 --app lumini-i-a');
      console.log('   fly secrets set EMAIL_USER=seu-email@gmail.com --app lumini-i-a');
      console.log('   fly secrets set EMAIL_PASS=sua-senha-app --app lumini-i-a');
      console.log('   fly secrets set EMAIL_SECURE=false --app lumini-i-a');
      process.exit(1);
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user, pass }
    });

    console.log('   📧 Testando conexão...');
    await transporter.verify();
    console.log('   ✅ Conexão SMTP estabelecida com sucesso!');

    // 4. Testar envio real
    console.log('\n📬 4. TESTANDO ENVIO DE EMAIL:');
    const testEmail = process.argv[2] || user;
    console.log(`   Enviando email de teste para: ${testEmail}`);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Lumini I.A" <${user}>`,
      to: testEmail,
      subject: '✅ Teste de Email - Lumini I.A',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8b5cf6;">✅ Sistema de Email Funcionando!</h2>
          <p>Este é um email de teste do sistema Lumini I.A.</p>
          <p>Se você recebeu este email, significa que o sistema de recuperação de senha está funcionando corretamente!</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Data: ${new Date().toLocaleString('pt-BR')}<br>
            Servidor: ${host}:${port}<br>
            De: ${process.env.EMAIL_FROM || user}
          </p>
        </div>
      `
    });

    console.log('   ✅ Email enviado com sucesso!');
    console.log('\n🎉 === SISTEMA DE EMAIL FUNCIONANDO PERFEITAMENTE! ===');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Verifique sua caixa de entrada');
    console.log('   2. Verifique a pasta de SPAM/Lixo Eletrônico');
    console.log('   3. Teste a recuperação de senha em: https://www.luminiiadigital.com.br/forgot-password');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO ENCONTRADO:');
    console.error('   Mensagem:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 SOLUÇÃO: Problema de autenticação!');
      console.log('   Se estiver usando Gmail:');
      console.log('   1. Ative a verificação em 2 etapas');
      console.log('   2. Gere uma "Senha de App" em: https://myaccount.google.com/apppasswords');
      console.log('   3. Use essa senha no EMAIL_PASS');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.log('\n💡 SOLUÇÃO: Problema de conexão!');
      console.log('   Verifique se o HOST e PORTA estão corretos');
      console.log('   Gmail: smtp.gmail.com:587');
      console.log('   Outlook: smtp-mail.outlook.com:587');
    }
    
    console.error('\n📋 Detalhes completos:', error);
    process.exit(1);
  }
}

diagnoseEmail();
