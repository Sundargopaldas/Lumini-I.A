const sequelize = require('./backend/config/database');
const User = require('./backend/models/User');

(async () => {
  try {
    console.log('Conectando...');
    await sequelize.authenticate();
    console.log('Conectado!');
    
    const user = await User.findOne({ where: { email: 'sundaragopaldas@gmail.com' } });
    
    if (user) {
      console.log('Usuario encontrado:', user.email);
      await user.destroy();
      console.log('✅ DELETADO COM SUCESSO!');
    } else {
      console.log('Usuario nao encontrado');
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
  process.exit(0);
})();
