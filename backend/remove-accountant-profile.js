require('dotenv').config();
const Accountant = require('./models/Accountant');

(async () => {
  try {
    const userId = 3; // Luis (luidmachado@yahoo.com)
    
    console.log(`\n🗑️  Removendo perfil de contador do usuário ID: ${userId}`);
    
    const result = await Accountant.destroy({ where: { userId } });
    
    if (result > 0) {
      console.log(`✅ Perfil de contador removido com sucesso!`);
      console.log(`   Agora o usuário NÃO terá mais acesso à Área do Contador.\n`);
    } else {
      console.log(`⚠️  Nenhum perfil encontrado para este usuário.\n`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
})();
