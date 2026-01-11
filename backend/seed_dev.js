const sequelize = require('./config/database');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Category = require('./models/Category');
const Goal = require('./models/Goal');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed do banco de desenvolvimento...');

    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    // Criar usuário de teste
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const [user, created] = await User.findOrCreate({
      where: { email: 'teste@lumini.com' },
      defaults: {
        name: 'Usuário Teste',
        email: 'teste@lumini.com',
        password: hashedPassword,
        plan: 'premium',
        monthlyIncome: 5000,
        taxRegime: 'mei'
      }
    });

    if (created) {
      console.log('✅ Usuário de teste criado: teste@lumini.com / 123456');
    } else {
      console.log('ℹ️  Usuário de teste já existe');
    }

    // Criar categorias
    const categories = [
      { name: 'Alimentação', type: 'expense', userId: user.id },
      { name: 'Transporte', type: 'expense', userId: user.id },
      { name: 'Moradia', type: 'expense', userId: user.id },
      { name: 'Salário', type: 'income', userId: user.id },
      { name: 'Freelance', type: 'income', userId: user.id }
    ];

    for (const cat of categories) {
      await Category.findOrCreate({
        where: { name: cat.name, userId: user.id },
        defaults: cat
      });
    }
    console.log('✅ Categorias criadas');

    // Criar transações de exemplo
    const now = new Date();
    const transactions = [
      {
        userId: user.id,
        amount: 5000,
        description: 'Salário do mês',
        date: new Date(now.getFullYear(), now.getMonth(), 5),
        type: 'income',
        source: 'manual'
      },
      {
        userId: user.id,
        amount: -350,
        description: 'Supermercado',
        date: new Date(now.getFullYear(), now.getMonth(), 10),
        type: 'expense',
        source: 'manual'
      },
      {
        userId: user.id,
        amount: -150,
        description: 'Conta de luz',
        date: new Date(now.getFullYear(), now.getMonth(), 15),
        type: 'expense',
        source: 'manual'
      },
      {
        userId: user.id,
        amount: -200,
        description: 'Internet',
        date: new Date(now.getFullYear(), now.getMonth(), 12),
        type: 'expense',
        source: 'manual'
      },
      {
        userId: user.id,
        amount: 1500,
        description: 'Projeto freelance',
        date: new Date(now.getFullYear(), now.getMonth(), 20),
        type: 'income',
        source: 'manual'
      }
    ];

    for (const trans of transactions) {
      await Transaction.create(trans);
    }
    console.log('✅ Transações de exemplo criadas');

    // Criar meta de exemplo
    await Goal.findOrCreate({
      where: { title: 'Fundo de Emergência', userId: user.id },
      defaults: {
        userId: user.id,
        title: 'Fundo de Emergência',
        targetAmount: 10000,
        currentAmount: 2000,
        deadline: new Date(now.getFullYear(), 11, 31),
        category: 'savings'
      }
    });
    console.log('✅ Meta de exemplo criada');

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📧 Login: teste@lumini.com');
    console.log('🔑 Senha: 123456\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao popular banco:', error);
    process.exit(1);
  }
}

seedDatabase();
