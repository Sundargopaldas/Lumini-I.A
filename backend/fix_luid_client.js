const sequelize = require('./config/database');
const User = require('./models/User');
const Accountant = require('./models/Accountant');

async function fixLuidClient() {
  try {
    await sequelize.authenticate();
    
    // Find Sundar Accountant
    const sundarUser = await User.findOne({ where: { email: 'sundaragopaldas@gmail.com' } });
    if (!sundarUser) return console.log('Sundar user not found');
    
    const sundarAccountant = await Accountant.findOne({ where: { userId: sundarUser.id } });
    if (!sundarAccountant) return console.log('Sundar accountant not found');

    console.log(`Sundar Accountant ID: ${sundarAccountant.id}`);

    // Find Luid (trying luidmachado@yahoo.com first as likely candidate)
    let luidUser = await User.findOne({ where: { email: 'luidmachado@yahoo.com' } });
    
    if (!luidUser) {
        console.log('luidmachado@yahoo.com not found. Creating luid@yahoo.com...');
        // Create luid@yahoo.com if luidmachado doesn't exist either
        luidUser = await User.create({
            name: 'Luis',
            email: 'luid@yahoo.com',
            password: 'password123', // temporary
            accountantId: sundarAccountant.id
        });
    } else {
        console.log(`Found luidmachado@yahoo.com (ID: ${luidUser.id}). Linking to Sundar...`);
        await luidUser.update({ accountantId: sundarAccountant.id });
    }

    console.log(`Linked ${luidUser.email} to accountant ${sundarAccountant.id}`);

  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

fixLuidClient();
