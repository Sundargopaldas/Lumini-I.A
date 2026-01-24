const { Pool } = require('pg');

async function checkAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const email = 'contato@luminiiadigital.com.br';
    
    console.log(`🔍 Verificando status do admin: ${email}`);
    
    const result = await pool.query(
      'SELECT id, email, username, "isAdmin", "emailVerified", "verificationToken", "createdAt" FROM "Users" WHERE email = $1',
      [email]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ ADMIN ENCONTRADO NO BANCO:');
      console.log(JSON.stringify(result.rows[0], null, 2));
      console.log('\n📊 Detalhes:');
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Username: ${result.rows[0].username}`);
      console.log(`   isAdmin: ${result.rows[0].isAdmin}`);
      console.log(`   Email Verificado: ${result.rows[0].emailVerified}`);
      console.log(`   Verification Token: ${result.rows[0].verificationToken ? 'TEM' : 'NÃO TEM (usuário antigo)'}`);
      console.log(`   Criado em: ${result.rows[0].createdAt}`);
    } else {
      console.log('❌ ADMIN NÃO ENCONTRADO NO BANCO!');
      console.log('   Verifique se o email está correto.');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao verificar:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkAdmin();
