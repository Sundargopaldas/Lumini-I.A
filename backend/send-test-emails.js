const { sendWelcomeEmail, sendCancellationEmail } = require('./services/EmailService');

(async () => {
    console.log('\n🧪 ========== TESTE DE E-MAILS ==========\n');
    
    const testUser = {
        email: 'contato@luminiiadigital.com.br',
        name: 'Administrador Lumini'
    };

    // 1. E-mail de Boas-vindas
    console.log('📧 1/2: Enviando e-mail de BOAS-VINDAS...');
    try {
        await sendWelcomeEmail(testUser, 'Premium');
        console.log('✅ E-mail de boas-vindas enviado!\n');
    } catch (error) {
        console.error('❌ Erro ao enviar e-mail de boas-vindas:', error.message, '\n');
    }

    // 2. E-mail de Cancelamento
    console.log('📧 2/2: Enviando e-mail de CANCELAMENTO...');
    try {
        await sendCancellationEmail(testUser, 'Teste de cancelamento - Encontrei uma solução mais barata, sistema não atendeu minhas necessidades');
        console.log('✅ E-mail de cancelamento enviado!\n');
    } catch (error) {
        console.error('❌ Erro ao enviar e-mail de cancelamento:', error.message, '\n');
    }

    console.log('✅ TESTE CONCLUÍDO!\n');
    console.log('📬 Verifique a caixa de entrada de: contato@luminiiadigital.com.br\n');
    
    process.exit(0);
})();
