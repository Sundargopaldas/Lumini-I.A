require('dotenv').config();
const { sendCancellationEmail } = require('./services/EmailService');

const testCancelEmail = async () => {
  console.log('Iniciando teste de email de cancelamento...');
  // Usando o email configurado no .env para garantir que você receba o teste
  const user = { email: process.env.EMAIL_USER, name: 'Teste Admin' };
  const reason = 'Teste manual de verificação de email';

  try {
    console.log(`Tentando enviar para: ${user.email}`);
    await sendCancellationEmail(user, reason);
    console.log('Função sendCancellationEmail executada com sucesso.');
  } catch (error) {
    console.error('Erro ao executar sendCancellationEmail:', error);
  }
};

testCancelEmail();
