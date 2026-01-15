require('dotenv').config();
const User = require('./models/User');
const Accountant = require('./models/Accountant');

(async () => {
  try {
    console.log('\n🔍 ===== DIAGNÓSTICO DE CONTADORES =====\n');

    // 1. Listar TODOS os usuários
    const allUsers = await User.findAll({
      attributes: ['id', 'email', 'username', 'isAdmin', 'accountantId']
    });

    console.log('📋 TODOS OS USUÁRIOS:');
    allUsers.forEach(u => {
      console.log(`  ID: ${u.id} | Email: ${u.email} | Username: ${u.username} | isAdmin: ${u.isAdmin} | accountantId: ${u.accountantId || 'NULL'}`);
    });

    console.log('\n');

    // 2. Listar TODOS os contadores cadastrados
    const allAccountants = await Accountant.findAll({
      attributes: ['id', 'userId', 'email', 'name']
    });

    console.log('👔 TODOS OS CONTADORES CADASTRADOS:');
    allAccountants.forEach(a => {
      console.log(`  ID: ${a.id} | userId: ${a.userId} | Email: ${a.email} | Nome: ${a.name}`);
    });

    console.log('\n');

    // 3. Verificar cada usuário específico
    const testEmails = [
      'luidmachado@yahoo.com',
      'elcspencer@gmail.com',
      'contato@luminidigital.com'
    ];

    console.log('🔍 VERIFICAÇÃO ESPECÍFICA:');
    for (const email of testEmails) {
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        console.log(`\n❌ ${email}: NÃO ENCONTRADO`);
        continue;
      }

      const accountant = await Accountant.findOne({ where: { userId: user.id } });
      const isAccountant = !!accountant;

      console.log(`\n✅ ${email}:`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   isAdmin: ${user.isAdmin}`);
      console.log(`   accountantId (vinculado a): ${user.accountantId || 'NENHUM'}`);
      console.log(`   TEM PERFIL DE CONTADOR? ${isAccountant ? '✅ SIM' : '❌ NÃO'}`);
      
      if (accountant) {
        console.log(`   → Perfil Contador ID: ${accountant.id}`);
        console.log(`   → Nome do Escritório: ${accountant.name}`);
        console.log(`   → Email do Escritório: ${accountant.email}`);
      }
    }

    console.log('\n✅ ===== DIAGNÓSTICO CONCLUÍDO =====\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
})();
