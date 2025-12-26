const User = require('./backend/models/User');
const sequelize = require('./backend/config/database');

async function listUsers() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');
    
    const users = await User.findAll();
    console.log('Users found:', users.map(u => ({ id: u.id, email: u.email, plan: u.plan })));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

listUsers();
