const sequelize = require('./config/database');
const User = require('./models/User');

async function upgradeUser() {
  try {
    console.log('🔧 Conectando ao banco...');
    await sequelize.authenticate();
    
    const email = 'sundaragopaldas@gmail.com';
    
    console.log(`🔍 Procurando usuário: ${email}`);
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.error('❌ Usuário não encontrado!');
      process.exit(1);
    }
    
    console.log('\n📊 Dados atuais:');
    console.log('   Email:', user.email);
    console.log('   Nome:', user.name);
    console.log('   Plano:', user.plan);
    console.log('   Admin:', user.isAdmin);
    
    console.log('\n⬆️  Atualizando para Premium + Admin...');
    await user.update({
      plan: 'premium',
      isAdmin: true
    });
    
    console.log('\n✅ Usuário atualizado com sucesso!');
    console.log('\n📊 Dados novos:');
    console.log('   Email:', user.email);
    console.log('   Nome:', user.name);
    console.log('   Plano:', user.plan);
    console.log('   Admin:', user.isAdmin);
    
    console.log('\n🎉 Pronto! Faça logout e login novamente para ver as mudanças.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

upgradeUser();
