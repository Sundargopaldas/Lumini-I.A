require('dotenv').config();
const { Sequelize } = require('sequelize');

// Configuração do banco de dados
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function promoteUser() {
  try {
    // Primeiro listar todos os usuários
    console.log('📋 Listando todos os usuários...\n');
    
    const [allUsers] = await sequelize.query(
      'SELECT id, email, name, plan FROM Users'
    );
    
    console.log('Usuários encontrados:', allUsers.length);
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.name}) - Plano: ${u.plan}`);
    });
    
    const email = 'contato@luminiiadigital.com.br';
    
    console.log('\n🔍 Buscando usuário:', email);
    
    const [results] = await sequelize.query(
      'SELECT id, email, name, plan FROM Users WHERE email = ?',
      { replacements: [email] }
    );
    
    if (results.length === 0) {
      console.log('❌ Usuário não encontrado!');
      process.exit(1);
    }
    
    const user = results[0];
    console.log('✅ Usuário encontrado:', user);
    console.log('📋 Plano atual:', user.plan);
    
    // Atualizar para Premium
    await sequelize.query(
      'UPDATE Users SET plan = ? WHERE email = ?',
      { replacements: ['premium', email] }
    );
    
    console.log('💎 PROMOVIDO PARA PREMIUM!');
    
    // Verificar
    const [updated] = await sequelize.query(
      'SELECT id, email, name, plan FROM Users WHERE email = ?',
      { replacements: [email] }
    );
    
    console.log('✅ Plano atualizado:', updated[0].plan);
    console.log('🎉 SUCESSO!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

promoteUser();
