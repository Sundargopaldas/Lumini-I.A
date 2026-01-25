const { Pool } = require('pg');
require('dotenv').config();

async function createInviteTokensTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Criando tabela InviteTokens...');

    // Criar tabela se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "InviteTokens" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR(255) NOT NULL,
        "token" VARCHAR(255) NOT NULL UNIQUE,
        "accountantId" INTEGER NOT NULL REFERENCES "Accountants"("id") ON DELETE CASCADE,
        "used" BOOLEAN DEFAULT false,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('✅ Tabela InviteTokens criada com sucesso!');

    // Criar índice para busca rápida por token
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "invite_tokens_token_idx" ON "InviteTokens"("token");
    `);

    console.log('✅ Índice criado!');

    // Criar índice para busca por email
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "invite_tokens_email_idx" ON "InviteTokens"("email");
    `);

    console.log('✅ Todos os índices criados!');

  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
  } finally {
    await pool.end();
  }
}

createInviteTokensTable();
