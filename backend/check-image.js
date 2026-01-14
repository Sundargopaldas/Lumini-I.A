const Accountant = require('./models/Accountant');
const sequelize = require('./config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco');
    
    const acc = await Accountant.findOne({ 
      where: { name: 'Martins Silva' } 
    });
    
    if (acc) {
      console.log('\n📸 DADOS DO CONTADOR:');
      console.log('ID:', acc.id);
      console.log('Nome:', acc.name);
      console.log('UserID:', acc.userId);
      console.log('Imagem:', acc.image);
      console.log('Verificado:', acc.verified);
      console.log('\n🔍 Caminho completo da imagem:', acc.image);
    } else {
      console.log('❌ Contador não encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await sequelize.close();
  }
})();
