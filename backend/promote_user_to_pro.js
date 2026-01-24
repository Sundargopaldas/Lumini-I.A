const { Sequelize } = require('sequelize');
const path = require('path');

// Configurar Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

const promoteUser = async (email) => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    // Buscar usuário
    const [users] = await sequelize.query(
      `SELECT id, email, plan FROM Users WHERE email = ?`,
      { replacements: [email] }
    );

    if (users.length === 0) {
      console.log('❌ Usuário não encontrado:', email);
      return;
    }

    const user = users[0];
    console.log('📋 Usuário encontrado:');
    console.log('   - ID:', user.id);
    console.log('   - Email:', user.email);
    console.log('   - Plano atual:', user.plan);

    // Promover para Pro
    await sequelize.query(
      `UPDATE Users SET plan = 'pro' WHERE email = ?`,
      { replacements: [email] }
    );

    console.log('✅ Usuário promovido para PRO!');

    // Verificar
    const [updated] = await sequelize.query(
      `SELECT id, email, plan FROM Users WHERE email = ?`,
      { replacements: [email] }
    );
    console.log('✅ Novo plano:', updated[0].plan);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await sequelize.close();
  }
};

// Email do usuário
const email = 'luidmachado@yahoo.com';
promoteUser(email);
