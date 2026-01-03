const { Sequelize, DataTypes } = require('./backend/node_modules/sequelize');
const path = require('path');
require('./backend/node_modules/dotenv').config({ path: path.resolve(__dirname, 'backend/.env') }); // Tenta carregar do backend/.env se existir
if (!process.env.DB_USER) require('./backend/node_modules/dotenv').config(); // Fallback para .env na raiz

// Configuração simplificada do banco (copiada de backend/config/database.js para ser standalone)
const sequelize = new Sequelize(
  process.env.DB_NAME || 'lumini_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

const Accountant = sequelize.define('Accountant', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  verified: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: true });

async function listAndApprove() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados.');

    // Listar pendentes
    const pending = await Accountant.findAll({ where: { verified: false } });

    console.log('\n📋 Contadores Pendentes de Verificação:');
    if (pending.length === 0) {
      console.log('   (Nenhum contador pendente)');
    } else {
      pending.forEach(acc => {
        console.log(`   [ID: ${acc.id}] ${acc.name} (${acc.email}) - CRC: ${acc.crc || 'N/A'}`);
      });
    }

    // Listar verificados (apenas informativo)
    const verified = await Accountant.findAll({ where: { verified: true }, limit: 5, order: [['updatedAt', 'DESC']] });
    console.log('\n✅ Últimos 5 Contadores Verificados:');
     if (verified.length === 0) {
      console.log('   (Nenhum contador verificado)');
    } else {
      verified.forEach(acc => {
        console.log(`   [ID: ${acc.id}] ${acc.name} (${acc.email})`);
      });
    }

    console.log('\n---');
    console.log('💡 Para aprovar um contador, execute este script passando o ID como argumento.');
    console.log('   Exemplo: node admin_approve_accountant.js 5');
    console.log('---\n');

    // Se argumento foi passado, aprovar
    const targetId = process.argv[2];
    if (targetId) {
        const accToApprove = await Accountant.findByPk(targetId);
        if (accToApprove) {
            accToApprove.verified = true;
            await accToApprove.save();
            console.log(`🎉 SUCESSO: Contador "${accToApprove.name}" (ID: ${accToApprove.id}) foi VERIFICADO!`);
            console.log('   Agora ele aparecerá na lista do Marketplace para os clientes.');
        } else {
            console.error(`❌ Erro: Contador com ID ${targetId} não encontrado.`);
        }
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

listAndApprove();
