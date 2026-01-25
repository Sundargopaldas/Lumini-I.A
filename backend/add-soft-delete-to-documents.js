const { Pool } = require('pg');

async function addSoftDeleteColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📝 [MIGRATION] Adicionando colunas de soft delete na tabela Documents...');
    
    // Verificar e adicionar deletedByAccountant
    const checkAccountant = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Documents' 
      AND column_name = 'deletedByAccountant'
    `);
    
    if (checkAccountant.rows.length === 0) {
      await pool.query(`
        ALTER TABLE "Documents" 
        ADD COLUMN "deletedByAccountant" BOOLEAN NOT NULL DEFAULT false
      `);
      console.log('✅ [MIGRATION] Coluna "deletedByAccountant" adicionada!');
    } else {
      console.log('ℹ️ [MIGRATION] Coluna "deletedByAccountant" já existe!');
    }
    
    // Verificar e adicionar deletedByClient
    const checkClient = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Documents' 
      AND column_name = 'deletedByClient'
    `);
    
    if (checkClient.rows.length === 0) {
      await pool.query(`
        ALTER TABLE "Documents" 
        ADD COLUMN "deletedByClient" BOOLEAN NOT NULL DEFAULT false
      `);
      console.log('✅ [MIGRATION] Coluna "deletedByClient" adicionada!');
    } else {
      console.log('ℹ️ [MIGRATION] Coluna "deletedByClient" já existe!');
    }
    
    console.log('\n✅ [MIGRATION] Migração concluída com sucesso!');
    console.log('📊 Agora contador e cliente podem deletar independentemente.');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ [MIGRATION] Erro:', error.message);
    console.error('❌ Detalhes:', error);
    await pool.end();
    process.exit(1);
  }
}

addSoftDeleteColumns();
