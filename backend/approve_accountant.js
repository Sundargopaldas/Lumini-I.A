/**
 * Script para aprovar contador manualmente
 * Uso: node backend/approve_accountant.js
 */

const sequelize = require('./config/database');
const Accountant = require('./models/Accountant');

async function approveAccountant() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    // Buscar todos os contadores não verificados
    const accountants = await Accountant.findAll({
      where: { verified: false }
    });

    if (accountants.length === 0) {
      console.log('ℹ️  Nenhum contador pendente de aprovação');
      process.exit(0);
    }

    console.log(`\n📋 Contadores pendentes de aprovação: ${accountants.length}\n`);

    // Aprovar todos
    for (const acc of accountants) {
      await acc.update({ verified: true });
      console.log(`✅ Aprovado: ${acc.name} (ID: ${acc.id}) - CRC: ${acc.crc}`);
    }

    console.log('\n🎉 Todos os contadores foram aprovados!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

approveAccountant();
