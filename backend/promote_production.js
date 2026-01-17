const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

async function promoteUser() {
  try {
    const email = 'contato@luminiiadigital.com.br';
    
    console.log('🔍 Buscando usuário em PRODUÇÃO:', email);
    
    const [results] = await sequelize.query(
      'SELECT id, email, name, plan FROM users WHERE email = ?',
      { replacements: [email] }
    );
    
    if (results.length === 0) {
      console.log('❌ Usuário não encontrado em produção!');
      process.exit(1);
    }
    
    const user = results[0];
    console.log('✅ Usuário encontrado:', user);
    console.log('📋 Plano atual:', user.plan);
    
    // Atualizar para Premium
    await sequelize.query(
      'UPDATE users SET plan = ? WHERE email = ?',
      { replacements: ['premium', email] }
    );
    
    console.log('💎 PROMOVIDO PARA PREMIUM!');
    
    // Verificar
    const [updated] = await sequelize.query(
      'SELECT id, email, name, plan FROM users WHERE email = ?',
      { replacements: [email] }
    );
    
    console.log('✅ Plano atualizado:', updated[0].plan);
    console.log('🎉 SUCESSO!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

promoteUser();
