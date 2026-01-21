require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function resetPassword() {
  try {
    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
      console.log('❌ Uso: node reset-my-password.js <email> <nova-senha>');
      console.log('📝 Exemplo: node reset-my-password.js escritorlcspencer@gmail.com MinhaNovaSenh@123');
      process.exit(1);
    }

    console.log('🔍 Buscando usuário...');
    const [users] = await sequelize.query(
      'SELECT id, email, name FROM "Users" WHERE email = ?',
      { replacements: [email] }
    );

    if (users.length === 0) {
      console.log('❌ Usuário não encontrado!');
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ Usuário encontrado: ${user.name} (${user.email})`);

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await sequelize.query(
      'UPDATE "Users" SET password = ? WHERE id = ?',
      { replacements: [hashedPassword, user.id] }
    );

    console.log('✅ Senha resetada com sucesso!');
    console.log(`\n🔐 Nova senha: ${newPassword}`);
    console.log(`📧 Email: ${email}`);
    console.log('\n🚀 Agora você pode fazer login em: https://www.luminiiadigital.com.br/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

resetPassword();
