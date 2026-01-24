const { Pool } = require('pg');

async function checkUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query(
      'SELECT email, "emailVerified" FROM "Users" WHERE email = $1',
      ['sundaragopaldas@gmail.com']
    );
    
    console.log(`📊 Resultado: ${result.rows.length} usuário(s) encontrado(s)`);
    
    if (result.rows.length > 0) {
      console.log('❌ USUÁRIO AINDA EXISTE NO BANCO:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('✅ USUÁRIO NÃO EXISTE NO BANCO (foi deletado com sucesso!)');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao verificar:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkUser();
