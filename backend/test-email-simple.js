require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  const EMAIL_HOST = process.env.EMAIL_HOST;
  const EMAIL_PORT = process.env.EMAIL_PORT || '587';
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;
  const EMAIL_FROM = process.env.EMAIL_FROM || `"Lumini I.A" <${EMAIL_USER}>`;
  const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true';

  console.log('📧 === TESTE DE EMAIL LUMINI I.A ===\n');
  console.log('📋 Configurações:');
  console.log(`   HOST: ${EMAIL_HOST}`);
  console.log(`   PORT: ${EMAIL_PORT}`);
  console.log(`   USER: ${EMAIL_USER}`);
  console.log(`   PASS: ${EMAIL_PASS ? '****** (configurado)' : '❌ NÃO CONFIGURADO'}`);
  console.log(`   FROM: ${EMAIL_FROM}`);
  console.log(`   SECURE: ${EMAIL_SECURE}`);

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.log('\n❌ ERRO: Variáveis de ambiente incompletas!');
    process.exit(1);
  }

  try {
    console.log('\n🔧 Criando transporter...');
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: parseInt(EMAIL_PORT),
      secure: EMAIL_SECURE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('🔍 Verificando conexão...');
    await transporter.verify();
    console.log('✅ Conexão SMTP OK!');

    const testEmail = process.argv[2] || 'escritorlcspencer@gmail.com';
    console.log(`\n📬 Enviando email de teste para: ${testEmail}`);

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: testEmail,
      subject: '✅ Teste de Recuperação de Senha - Lumini I.A',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #8b5cf6;">✅ Sistema de Email Funcionando!</h2>
          <p>Este é um email de teste do sistema de recuperação de senha do Lumini I.A.</p>
          <p><strong>Se você recebeu este email, o sistema está funcionando corretamente!</strong></p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Data: ${new Date().toLocaleString('pt-BR')}<br>
            Servidor: ${EMAIL_HOST}:${EMAIL_PORT}<br>
            De: ${EMAIL_FROM}
          </p>
        </div>
      `
    });

    console.log('✅ Email enviado com sucesso!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log('\n🎉 SISTEMA DE EMAIL FUNCIONANDO!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Verifique sua caixa de entrada');
    console.log('   2. Verifique a pasta SPAM/Lixo Eletrônico');
    console.log('   3. Se não recebeu, aguarde alguns minutos');

    process.exit(0);
  } catch (error) {
    console.log('\n❌ ERRO:',error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 PROBLEMA: Erro de autenticação!');
      console.log('   Para Gmail:');
      console.log('   1. Ative verificação em 2 etapas');
      console.log('   2. Gere uma Senha de App em: https://myaccount.google.com/apppasswords');
      console.log('   3. Use essa senha no EMAIL_PASS');
    }
    
    console.log('\n📋 Detalhes:', error);
    process.exit(1);
  }
}

testEmail();
