const User = require('./models/User');
const sequelize = require('./config/database');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected.');
    
    const email = 'bernardo@lumini.ai';
    const existing = await User.findOne({ where: { email } });
    
    if (existing) {
      console.log('User already exists. Updating password...');
      const hash = await bcrypt.hash('lumini.bernardo', 10);
      existing.password = hash;
      existing.plan = 'premium';
      existing.emailVerified = true;
      await existing.save();
      console.log('User updated successfully.');
    } else {
      console.log('Creating new user...');
      const hash = await bcrypt.hash('lumini.bernardo', 10);
      await User.create({
        name: 'Bernardo',
        email: email,
        password: hash,
        plan: 'premium',
        username: 'bernardo',
        emailVerified: true
      });
      console.log('User created successfully.');
    }
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
  process.exit(0);
})();
