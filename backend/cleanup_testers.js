const sequelize = require('./config/database');
const User = require('./models/User');

async function cleanupTesters() {
  try {
    console.log('🔧 Conectando ao banco...');
    await sequelize.authenticate();
    
    const testers = [
      'duarte57ejane@gmail.com',
      'leonardo.teste@luminiiadigital.com.br'
    ];
    
    console.log('\n📋 OPÇÕES DE LIMPEZA:');
    console.log('1. DELETAR completamente (não recomendado)');
    console.log('2. DOWNGRADE para FREE (recomendado)\n');
    
    // Por padrão, vamos fazer DOWNGRADE
    const action = process.argv[2] || 'downgrade';
    
    if (action === 'delete') {
      console.log('🗑️  DELETANDO testadores...\n');
      
      for (const email of testers) {
        const user = await User.findOne({ where: { email } });
        
        if (user) {
          await user.destroy();
          console.log(`✅ Deletado: ${email}`);
        } else {
          console.log(`⚠️  Não encontrado: ${email}`);
        }
      }
      
      console.log('\n🎉 Testadores deletados com sucesso!\n');
      
    } else {
      console.log('⬇️  FAZENDO DOWNGRADE para FREE...\n');
      
      for (const email of testers) {
        const user = await User.findOne({ where: { email } });
        
        if (user) {
          await user.update({ plan: 'free' });
          console.log(`✅ Downgrade: ${email} → FREE`);
        } else {
          console.log(`⚠️  Não encontrado: ${email}`);
        }
      }
      
      console.log('\n🎉 Testadores movidos para plano FREE!\n');
      console.log('💡 Eles podem continuar usando a versão gratuita se quiserem!\n');
    }
    
    console.log('📝 USO:');
    console.log('   Downgrade: node cleanup_testers.js');
    console.log('   Deletar:   node cleanup_testers.js delete\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

cleanupTesters();
