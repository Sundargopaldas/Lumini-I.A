const path = require('path');
// Database config already loads dotenv, but we might need it here if we used env vars directly.
// Relying on config/database.js to setup connection.
const sequelize = require('./config/database');
const User = require('./models/User');
const Accountant = require('./models/Accountant');
const { Op } = require('sequelize');

async function cleanupSundarClients() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // 1. Find Sundar's User ID (to get the linked accountant profile)
    const sundarUser = await User.findOne({ where: { email: 'sundaragopaldas@gmail.com' } });
    let accountantId;

    if (sundarUser) {
        console.log(`Sundar User ID: ${sundarUser.id}`);
        // Find Accountant linked to this user
        const sundarAccountant = await Accountant.findOne({ where: { userId: sundarUser.id } });
        if (sundarAccountant) {
            accountantId = sundarAccountant.id;
            console.log(`Sundar Accountant ID: ${accountantId}`);
        }
    }

    if (!accountantId) {
        // Fallback: try to find Accountant by email directly
        const sundarAccountantByEmail = await Accountant.findOne({ where: { email: 'sundaragopaldas@gmail.com' } });
        if (sundarAccountantByEmail) {
            accountantId = sundarAccountantByEmail.id;
            console.log(`Sundar Accountant ID (found by email): ${accountantId}`);
        }
    }

    if (!accountantId) {
        console.error('Sundar accountant profile not found!');
        return;
    }

    // 3. Find Luid's User ID
    const luidUser = await User.findOne({ where: { email: 'luid@yahoo.com' } });
    let luidUserId = luidUser ? luidUser.id : null;

    if (luidUserId) {
         console.log(`Luid User ID: ${luidUserId}`);
    } else {
        console.log('Luid user not found. Will remove ALL clients from Sundar.');
    }

    // 4. Update all OTHER users to remove accountantId
    const whereClause = {
        accountantId: accountantId
    };

    if (luidUserId) {
        whereClause.id = { [Op.ne]: luidUserId };
    }

    const result = await User.update(
      { accountantId: null },
      { where: whereClause }
    );

    console.log(`Cleanup complete. Removed ${result[0]} users from Sundar's list.`);
    
    // Verify
    const remaining = await User.findAll({ where: { accountantId: accountantId } });
    console.log('Remaining clients for Sundar:', remaining.map(u => `${u.name || u.username} (${u.email})`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

cleanupSundarClients();
