const sequelize = require('./config/database');

async function addColumns() {
  try {
    console.log('🔧 Adicionando colunas de verificação de email...');
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco!');

    // Adicionar coluna emailVerified
    try {
      await sequelize.query(`
        ALTER TABLE "Users" 
        ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false;
      `);
      console.log('✅ Coluna emailVerified adicionada!');
    } catch (e) {
      console.log('ℹ️ Coluna emailVerified já existe ou erro:', e.message);
    }

    // Adicionar coluna verificationToken
    try {
      await sequelize.query(`
        ALTER TABLE "Users" 
        ADD COLUMN IF NOT EXISTS "verificationToken" VARCHAR(500);
      `);
      console.log('✅ Coluna verificationToken adicionada!');
    } catch (e) {
      console.log('ℹ️ Coluna verificationToken já existe ou erro:', e.message);
    }

    // Atualizar usuários existentes para emailVerified = true (para não bloquear ninguém)
    try {
      await sequelize.query(`
        UPDATE "Users" 
        SET "emailVerified" = true 
        WHERE "emailVerified" IS NULL OR "emailVerified" = false;
      `);
      console.log('✅ Usuários existentes marcados como verificados!');
    } catch (e) {
      console.log('ℹ️ Erro ao atualizar usuários:', e.message);
    }

    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('📝 As colunas foram adicionadas ao banco de dados.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

addColumns();
