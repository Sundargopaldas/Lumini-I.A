// Script para adicionar colunas OAuth no PostgreSQL (Fly.io)
const sequelize = require('./config/database');

async function addOAuthColumns() {
  try {
    console.log('🔧 Adicionando colunas OAuth ao modelo Integration (PostgreSQL)...');
    
    // PostgreSQL
    await sequelize.query(`
      ALTER TABLE "Integrations" 
      ADD COLUMN IF NOT EXISTS "oauthAccessToken" TEXT,
      ADD COLUMN IF NOT EXISTS "oauthRefreshToken" TEXT,
      ADD COLUMN IF NOT EXISTS "oauthTokenExpiry" TIMESTAMP WITH TIME ZONE;
    `);

    console.log('✅ Colunas OAuth configuradas com sucesso no PostgreSQL!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas:', error);
    process.exit(1);
  }
}

addOAuthColumns();
