const { Pool } = require('pg');

async function checkEmail() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const email = 'silveiramachado2026@outlook.com';
    
    console.log(`🔍 Verificando se o email existe: ${email}`);
    
    const result = await pool.query(
      'SELECT id, email, username, "emailVerified", "createdAt" FROM "Users" WHERE email = $1',
      [email]
    );
    
    if (result.rows.length > 0) {
      console.log('❌ EMAIL JÁ EXISTE NO BANCO:');
      console.log(JSON.stringify(result.rows[0], null, 2));
      console.log('\n📊 Detalhes:');
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Username: ${result.rows[0].username}`);
      console.log(`   Email Verificado: ${result.rows[0].emailVerified}`);
      console.log(`   Criado em: ${result.rows[0].createdAt}`);
    } else {
      console.log('✅ EMAIL NÃO EXISTE - Pode cadastrar normalmente!');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao verificar:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkEmail();
