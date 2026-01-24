const { Pool } = require('pg');

async function deleteAndCheck() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🗑️ Deletando usuário sundaragopaldas@gmail.com...');
    
    const deleteResult = await pool.query(
      'DELETE FROM "Users" WHERE email = $1 RETURNING email',
      ['sundaragopaldas@gmail.com']
    );
    
    if (deleteResult.rowCount > 0) {
      console.log(`✅ Usuário ${deleteResult.rows[0].email} deletado com sucesso!`);
    } else {
      console.log('⚠️ Nenhum usuário foi deletado (talvez não existisse)');
    }
    
    // Verificar se realmente foi deletado
    const checkResult = await pool.query(
      'SELECT email FROM "Users" WHERE email = $1',
      ['sundaragopaldas@gmail.com']
    );
    
    if (checkResult.rowCount === 0) {
      console.log('✅ CONFIRMADO: Usuário não existe mais no banco!');
      console.log('📧 Agora você pode criar uma nova conta com este email.');
    } else {
      console.log('❌ ERRO: Usuário ainda existe no banco!');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
    process.exit(1);
  }
}

deleteAndCheck();
