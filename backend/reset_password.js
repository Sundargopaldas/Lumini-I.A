const sequelize = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const checkUser = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');

    const email = 'sundaragopaldas@gmail.com';
    const user = await User.findOne({ where: { email } });

    if (user) {
      console.log(`User found: ${user.email} (ID: ${user.id})`);
      // Reset password to '123456'
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      user.password = hashedPassword;
      await user.save();
      console.log('Password reset to: 123456');
    } else {
      console.log('User not found. Creating...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      await User.create({
        username: 'Sundara',
        email: email,
        password: hashedPassword,
        plan: 'free'
      });
      console.log('User created with password: 123456');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
};

checkUser();