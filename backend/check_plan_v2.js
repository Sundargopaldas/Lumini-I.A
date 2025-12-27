const sequelize = require('./config/database');
const User = require('./models/User');

const check = async () => {
  try {
    await sequelize.authenticate();
    const users = await User.findAll({ attributes: ['id', 'email', 'plan'] });
    console.log('--- USER PLANS (VERIFICATION) ---');
    users.forEach(u => console.log(`ID: ${u.id} | Email: ${u.email} | Plan: ${u.plan}`));
    console.log('---------------------------------');
  } catch (error) {
    console.error(error);
  } finally {
    await sequelize.close();
  }
};
check();
