require('dotenv').config();
const sequelize = require('./config/database');
const Transaction = require('./models/Transaction');
const Integration = require('./models/Integration');
const User = require('./models/User');

async function debugIntegrations() {
  try {
    await sequelize.authenticate();
    console.log('\n✅ Database connected\n');

    // Find admin
    const admin = await User.findOne({ where: { isAdmin: true } });
    if (!admin) {
      console.log('❌ Admin not found');
      process.exit(1);
    }

    console.log(`👤 ADMIN: ${admin.username} (ID: ${admin.id})\n`);

    // List integrations
    const integrations = await Integration.findAll({
      where: { userId: admin.id }
    });

    console.log(`🔌 INTEGRAÇÕES CONECTADAS: ${integrations.length}`);
    integrations.forEach((int, i) => {
      console.log(`   ${i + 1}. ${int.provider} (Status: ${int.status}, ID: ${int.id})`);
    });

    // List ALL transactions for admin
    const allTransactions = await Transaction.findAll({
      where: { userId: admin.id },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    console.log(`\n📊 TRANSAÇÕES DO ADMIN: ${allTransactions.length} (últimas 20)`);
    allTransactions.forEach((t, i) => {
      console.log(`   ${i + 1}. [${t.date}] ${t.description} - R$ ${t.amount} (${t.type}) - Source: ${t.source || 'N/A'}`);
    });

    // Check for today's transactions
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = await Transaction.findAll({
      where: { 
        userId: admin.id,
        date: today
      }
    });

    console.log(`\n🎯 TRANSAÇÕES DE HOJE (${today}): ${todayTransactions.length}`);
    todayTransactions.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.description} - R$ ${t.amount} (${t.type}) - Source: ${t.source}`);
    });

    // Check for integration sources
    const integrationSources = ['Nubank', 'Open Finance', 'Hotmart', 'YouTube', 'Stripe'];
    for (const source of integrationSources) {
      const count = await Transaction.count({
        where: { 
          userId: admin.id,
          source: source
        }
      });
      if (count > 0) {
        console.log(`\n🔗 TRANSAÇÕES DE ${source}: ${count}`);
      }
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  }
}

debugIntegrations();
