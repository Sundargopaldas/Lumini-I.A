const sequelize = require('./config/database');
const User = require('./models/User');
const { sendCancellationEmail } = require('./services/EmailService');

(async () => {
    try {
        console.log('\n🔄 CANCELAMENTO DIRETO DE ASSINATURA\n');
        
        const adminEmail = 'contato@luminiiadigital.com.br';
        const cancellationReason = 'Teste de e-mail de cancelamento - Sistema funcionando perfeitamente!';
        
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados');
        
        const user = await User.findOne({ where: { email: adminEmail } });
        
        if (!user) {
            console.log('❌ Usuário não encontrado');
            process.exit(1);
        }
        
        console.log(`\n📋 Usuário encontrado:`);
        console.log(`   Nome: ${user.name || user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Plano atual: ${user.plan}`);
        console.log(`   isAdmin: ${user.isAdmin}`);
        
        // Enviar e-mail de cancelamento
        console.log(`\n📧 Enviando e-mail de cancelamento...`);
        await sendCancellationEmail({
            email: user.email,
            name: user.name || user.username
        }, cancellationReason);
        
        console.log('✅ E-mail de cancelamento enviado!');
        
        console.log(`\n📬 Verifique a caixa de entrada: ${user.email}`);
        console.log(`\n✅ TESTE CONCLUÍDO COM SUCESSO!\n`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
})();
