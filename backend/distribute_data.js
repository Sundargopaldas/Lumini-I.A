const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'lumini_ia',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || 'root',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

const Transaction = require('./models/Transaction');

async function distributeData() {
  try {
    await sequelize.authenticate();
    console.log('Connection established.');
    
    // Get transactions from User 5 (source)
    const sourceTransactions = await Transaction.findAll({ where: { userId: 5 } });
    console.log(`Found ${sourceTransactions.length} transactions for User 5.`);

    if (sourceTransactions.length === 0) {
        console.log('No transactions found to duplicate.');
        return;
    }

    const targetUsers = [1, 2]; // teste@lumini.ai, sundaragopaldas@gmail.com

    for (const userId of targetUsers) {
        console.log(`Duplicating for User ID ${userId}...`);
        const newTransactions = sourceTransactions.map(t => ({
            amount: t.amount,
            description: t.description,
            source: t.source,
            type: t.type,
            date: t.date,
            userId: userId, // New User ID
            categoryId: t.categoryId,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        await Transaction.bulkCreate(newTransactions);
        console.log(`Created ${newTransactions.length} transactions for User ${userId}.`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

distributeData();
