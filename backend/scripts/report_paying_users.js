const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const User = require('../models/User');

async function reportPayingUsers() {
  const outputPath = path.join(__dirname, '../../paying_users_report.txt');
  let output = '';

  try {
    await sequelize.authenticate();
    output += 'Database connected.\n';

    const payingUsers = await User.findAll({
      where: sequelize.literal("plan != 'free'"),
      attributes: ['id', 'name', 'email', 'plan', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    output += '\n=== RELATÓRIO DE USUÁRIOS PAGANTES ===\n';
    output += `Total encontrado: ${payingUsers.length}\n\n`;

    if (payingUsers.length === 0) {
      output += 'Nenhum usuário pagante encontrado.\n';
    } else {
      output += 'ID | Nome | Email | Plano | Data Cadastro\n';
      output += '---|------|-------|-------|--------------\n';
      payingUsers.forEach(u => {
        output += `${u.id} | ${u.name || 'N/A'} | ${u.email} | ${u.plan} | ${new Date(u.createdAt).toLocaleDateString('pt-BR')}\n`;
      });
    }
    
    // Count by plan
    const planCounts = payingUsers.reduce((acc, user) => {
        acc[user.plan] = (acc[user.plan] || 0) + 1;
        return acc;
    }, {});
    
    output += '\n=== RESUMO POR PLANO ===\n';
    for (const [plan, count] of Object.entries(planCounts)) {
        output += `${plan}: ${count}\n`;
    }

    fs.writeFileSync(outputPath, output);
    console.log(`Relatório salvo em: ${outputPath}`);

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

reportPayingUsers();
