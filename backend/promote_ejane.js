const sequelize = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function promoteEjane() {
  try {
    console.log('🔧 Conectando ao banco...');
    await sequelize.authenticate();
    
    const email = 'duarte57ejane@gmail.com';
    
    console.log(`🔍 Procurando usuário: ${email}`);
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('❌ Usuária não encontrada, criando nova conta...');
      
      const hashedPassword = await bcrypt.hash('Lumini2026!', 10);
      
      user = await User.create({
        name: 'Ejane Duarte',
        email: email,
        username: 'ejaneduarte',
        password: hashedPassword,
        plan: 'premium',
        isAccountant: false,
        isAdmin: false
      });
      
      console.log('✅ Conta criada com sucesso!');
      console.log('📧 Email:', email);
      console.log('🔑 Senha temporária: Lumini2026!');
      console.log('⚠️  IMPORTANTE: Peça para ela trocar a senha no primeiro login!');
    } else {
      console.log('✅ Usuária encontrada!');
    }
    
    console.log('\n📊 Dados atuais:');
    console.log('   Email:', user.email);
    console.log('   Nome:', user.name);
    console.log('   Plano:', user.plan);
    
    if (user.plan !== 'premium') {
      console.log('\n⬆️  Promovendo para Premium...');
      await user.update({
        plan: 'premium'
      });
      console.log('✅ Promovida para Premium!');
    } else {
      console.log('✅ Já está no plano Premium!');
    }
    
    console.log('\n📊 Dados finais:');
    console.log('   Email:', user.email);
    console.log('   Nome:', user.name);
    console.log('   Plano:', user.plan);
    console.log('   Contador:', user.isAccountant);
    
    console.log('\n🎉 Pronto! Ejane Duarte está no plano Premium!\n');
    console.log('📧 Credenciais:');
    console.log('   Email: duarte57ejane@gmail.com');
    console.log('   Senha: Lumini2026!');
    console.log('   Login: https://www.luminiiadigital.com.br/login\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

promoteEjane();
