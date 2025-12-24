const sequelize = require('./config/database');
const User = require('./models/User');
const Category = require('./models/Category');
const Transaction = require('./models/Transaction');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected.');
    
    // Skip sync in seed script to avoid "Too many keys" error if table already exists
    // await sequelize.sync({ alter: true });

    // 1. Get or Create User
    // Try to find the user created by the user, or create a default one
    let user = await User.findOne();
    
    if (!user) {
      console.log('No user found. Creating default test user...');
      const hashedPassword = await bcrypt.hash('123456', 10);
      user = await User.create({
        username: 'Joao Teste',
        email: 'joao@teste.com',
        password: hashedPassword,
        plan: 'pro'
      });
      console.log('Created user: joao@teste.com / 123456');
    } else {
        // If user exists but is not joao@teste.com, let's create joao if it doesn't exist
        const joao = await User.findOne({ where: { email: 'joao@teste.com' } });
        if (!joao) {
            const hashedPassword = await bcrypt.hash('123456', 10);
            user = await User.create({
                username: 'Joao Teste',
                email: 'joao@teste.com',
                password: hashedPassword,
                plan: 'pro'
            });
            console.log('Created user: joao@teste.com / 123456');
        } else {
            user = joao;
            console.log(`Using existing user: ${user.email}`);
        }
    }

    // 2. Create Categories
    const categoriesData = [
      { name: 'Salary', type: 'income' },
      { name: 'Freelance', type: 'income' },
      { name: 'YouTube Revenue', type: 'income' },
      { name: 'Investments', type: 'income' },
      { name: 'Food', type: 'expense' },
      { name: 'Transport', type: 'expense' },
      { name: 'Housing', type: 'expense' },
      { name: 'Entertainment', type: 'expense' },
      { name: 'Software', type: 'expense' },
      { name: 'Equipment', type: 'expense' }
    ];

    const categoryMap = {}; // name -> id

    for (const cat of categoriesData) {
      const [category] = await Category.findOrCreate({
        where: { name: cat.name, type: cat.type },
        defaults: { name: cat.name, type: cat.type }
      });
      categoryMap[cat.name] = category.id;
    }
    console.log('Categories synced.');

    // 3. Create Transactions
    const transactionsData = [
      { amount: 5000.00, description: 'Monthly Salary', type: 'income', category: 'Salary', source: 'Employer' },
      { amount: 1200.50, description: 'Website Project', type: 'income', category: 'Freelance', source: 'Client X' },
      { amount: 350.00, description: 'AdSense Revenue', type: 'income', category: 'YouTube Revenue', source: 'Google' },
      { amount: 45.90, description: 'Lunch', type: 'expense', category: 'Food', source: 'Restaurant' },
      { amount: 15.00, description: 'Uber to meeting', type: 'expense', category: 'Transport', source: 'Uber' },
      { amount: 1200.00, description: 'Rent', type: 'expense', category: 'Housing', source: 'Landlord' },
      { amount: 29.99, description: 'Adobe Creative Cloud', type: 'expense', category: 'Software', source: 'Adobe' },
      { amount: 89.90, description: 'Dinner with client', type: 'expense', category: 'Food', source: 'Restaurant' },
      { amount: 2500.00, description: 'New Laptop', type: 'expense', category: 'Equipment', source: 'Apple Store' },
      { amount: 120.00, description: 'Netflix & Spotify', type: 'expense', category: 'Entertainment', source: 'Streaming' },
    ];

    console.log('Inserting transactions...');
    
    for (const t of transactionsData) {
      await Transaction.create({
        amount: t.amount,
        description: t.description,
        type: t.type,
        date: new Date(), // Today
        userId: user.id,
        categoryId: categoryMap[t.category],
        source: t.source
      });
    }

    console.log('✅ Database populated with test data successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
