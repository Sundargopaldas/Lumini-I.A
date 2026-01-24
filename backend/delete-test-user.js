const { Pool } = require('pg');

async function deleteUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query(
      'DELETE FROM "Users" WHERE email = $1',
      ['sundaragopaldas@gmail.com']
    );
    
    console.log('✅ Usuário deletado com sucesso!');
    console.log(`📊 Linhas afetadas: ${result.rowCount}`);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao deletar:', error.message);
    await pool.end();
    process.exit(1);
  }
}

deleteUser();
