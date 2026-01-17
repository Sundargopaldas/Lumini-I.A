// Script para adicionar colunas OAuth no modelo Integration
// Forçar uso de SQLite local
process.env.DATABASE_URL = '';
const sequelize = require('./config/database');

async function addOAuthColumns() {
  try {
    console.log('🔧 Adicionando colunas OAuth ao modelo Integration...');
    
    // Adicionar colunas se não existirem
    await sequelize.query(`
      ALTER TABLE Integrations 
      ADD COLUMN IF NOT EXISTS oauthAccessToken TEXT,
      ADD COLUMN IF NOT EXISTS oauthRefreshToken TEXT,
      ADD COLUMN IF NOT EXISTS oauthTokenExpiry DATETIME;
    `).catch(() => {
      // SQLite usa sintaxe diferente
      return sequelize.query(`
        PRAGMA table_info(Integrations);
      `).then(async ([columns]) => {
        const columnNames = columns.map(c => c.name);
        
        if (!columnNames.includes('oauthAccessToken')) {
          await sequelize.query(`ALTER TABLE Integrations ADD COLUMN oauthAccessToken TEXT;`);
          console.log('✅ Coluna oauthAccessToken adicionada');
        }
        
        if (!columnNames.includes('oauthRefreshToken')) {
          await sequelize.query(`ALTER TABLE Integrations ADD COLUMN oauthRefreshToken TEXT;`);
          console.log('✅ Coluna oauthRefreshToken adicionada');
        }
        
        if (!columnNames.includes('oauthTokenExpiry')) {
          await sequelize.query(`ALTER TABLE Integrations ADD COLUMN oauthTokenExpiry DATETIME;`);
          console.log('✅ Coluna oauthTokenExpiry adicionada');
        }
      });
    });

    console.log('✅ Colunas OAuth configuradas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas:', error);
    process.exit(1);
  }
}

addOAuthColumns();
