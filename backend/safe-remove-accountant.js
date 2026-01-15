require('dotenv').config();
const User = require('./models/User');
const Accountant = require('./models/Accountant');

(async () => {
  try {
    const userId = 3; // Luis (luidmachado@yahoo.com)
    
    console.log(`\n🔍 Buscando perfil de contador do usuário ID: ${userId}`);
    
    // 1. Find the accountant profile
    const accountant = await Accountant.findOne({ where: { userId } });
    
    if (!accountant) {
      console.log(`⚠️  Nenhum perfil de contador encontrado para este usuário.\n`);
      process.exit(0);
    }
    
    const accountantId = accountant.id;
    console.log(`✅ Perfil encontrado: ID ${accountantId} - ${accountant.name}`);
    
    // 2. Find all users linked to this accountant
    console.log(`\n🔗 Procurando usuários vinculados a este contador...`);
    const linkedUsers = await User.findAll({ 
      where: { accountantId },
      attributes: ['id', 'email', 'username']
    });
    
    if (linkedUsers.length > 0) {
      console.log(`📋 ${linkedUsers.length} usuário(s) vinculado(s):`);
      linkedUsers.forEach(u => {
        console.log(`   - ${u.email} (ID: ${u.id})`);
      });
      
      // 3. Unlink all users
      console.log(`\n🔓 Desvinculando todos os usuários...`);
      await User.update(
        { accountantId: null },
        { where: { accountantId } }
      );
      console.log(`✅ Usuários desvinculados com sucesso!`);
    } else {
      console.log(`✅ Nenhum usuário vinculado a este contador.`);
    }
    
    // 4. Now we can safely delete the accountant profile
    console.log(`\n🗑️  Removendo perfil de contador...`);
    await Accountant.destroy({ where: { id: accountantId } });
    
    console.log(`✅ Perfil de contador removido com sucesso!`);
    console.log(`   Agora ${accountant.email} NÃO terá mais acesso à Área do Contador.\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
