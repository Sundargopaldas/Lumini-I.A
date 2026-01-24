const sequelize = require('./config/database');
const User = require('./models/User');

async function deleteUser() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida!');

    const email = 'sundaragopaldas@gmail.com';
    console.log(`\n🗑️ Procurando usuário: ${email}`);

    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log('❌ Usuário não encontrado!');
      process.exit(0);
    }

    console.log(`✅ Usuário encontrado:`, {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      plan: user.plan
    });

    console.log('\n🗑️ Deletando usuário...');
    await user.destroy();
    
    console.log('✅ Usuário deletado com sucesso!');
    console.log('\n✨ Agora você pode criar uma nova conta com este email para testar a verificação!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
    process.exit(1);
  }
}

deleteUser();
