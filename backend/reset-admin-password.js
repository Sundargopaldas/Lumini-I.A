const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const email = 'contato@luminiiadigital.com.br';
    const newPassword = 'Admin@2026'; // SENHA TEMPORÁRIA - ALTERE DEPOIS!
    
    console.log(`🔑 [RESET] Resetando senha do admin: ${email}`);
    console.log(`🔑 [RESET] Nova senha temporária: ${newPassword}`);
    
    // Hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Atualizar senha no banco
    const result = await pool.query(
      'UPDATE "Users" SET password = $1 WHERE email = $2 RETURNING id, email, username',
      [hashedPassword, email]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ [RESET] SENHA RESETADA COM SUCESSO!');
      console.log('\n📊 Detalhes do usuário:');
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Username: ${result.rows[0].username}`);
      console.log(`\n🔐 USE ESTAS CREDENCIAIS PARA FAZER LOGIN:`);
      console.log(`   Email: ${email}`);
      console.log(`   Senha: ${newPassword}`);
      console.log(`\n⚠️ IMPORTANTE: Altere esta senha após fazer login!`);
    } else {
      console.log('❌ [RESET] Admin não encontrado no banco!');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ [RESET] Erro ao resetar senha:', error.message);
    console.error('❌ Erro detalhado:', error);
    await pool.end();
    process.exit(1);
  }
}

resetAdminPassword();
