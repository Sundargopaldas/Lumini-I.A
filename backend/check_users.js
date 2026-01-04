const sequelize = require('./config/database');
const User = require('./models/User');

async function listUsers() {
  try {
    await sequelize.authenticate();
    const users = await User.findAll();
    console.log('Users:', users.map(u => ({ id: u.id, name: u.name, email: u.email, accountantId: u.accountantId })));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

listUsers();
