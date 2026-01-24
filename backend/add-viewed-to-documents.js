const { Pool } = require('pg');

async function addViewedColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📝 [MIGRATION] Adicionando coluna "viewed" na tabela Documents...');
    
    // Verificar se a coluna já existe
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Documents' 
      AND column_name = 'viewed'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('ℹ️ [MIGRATION] Coluna "viewed" já existe!');
    } else {
      // Adicionar coluna
      await pool.query(`
        ALTER TABLE "Documents" 
        ADD COLUMN "viewed" BOOLEAN NOT NULL DEFAULT false
      `);
      console.log('✅ [MIGRATION] Coluna "viewed" adicionada com sucesso!');
    }
    
    // Mostrar documentos existentes
    const docs = await pool.query('SELECT id, "originalName", "clientId", "viewed" FROM "Documents" ORDER BY id');
    console.log(`\n📊 Documentos no banco (${docs.rows.length}):`);
    docs.rows.forEach(doc => {
      console.log(`   - [${doc.id}] ${doc.originalName} | Cliente: ${doc.clientId} | Visualizado: ${doc.viewed}`);
    });
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ [MIGRATION] Erro:', error.message);
    console.error('❌ Detalhes:', error);
    await pool.end();
    process.exit(1);
  }
}

addViewedColumn();
