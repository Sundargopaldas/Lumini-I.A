#!/usr/bin/env node

/**
 * Script para criar usuário ADMIN com plano PRO
 * Execute: node create_admin.js
 */

const sequelize = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
  try {
    console.log('🔐 Criando usuário administrador...\n');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados\n');
    
    // Dados do admin
    const adminEmail = 'admin@luminiiadigital.com.br';
    const adminPassword = 'Lumini@Admin2026'; // Senha forte padrão
    
    // Verificar se admin já existe
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    
    if (existingAdmin) {
      console.log('⚠️  Usuário admin já existe!');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Plano: ${existingAdmin.plan}`);
      console.log(`   Role: ${existingAdmin.role || 'user'}\n`);
      
      // Atualizar para garantir que é pro
      if (existingAdmin.plan !== 'pro') {
        existingAdmin.plan = 'pro';
        await existingAdmin.save();
        console.log('✅ Plano atualizado para PRO\n');
      }
      
      process.exit(0);
    }
    
    // Criar hash da senha
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Criar admin
    const admin = await User.create({
      username: 'Administrador Lumini',
      email: adminEmail,
      password: hashedPassword,
      plan: 'pro',
      role: 'admin'
    });
    
    console.log('✅ Usuário administrador criado com sucesso!\n');
    console.log('📋 CREDENCIAIS DE ACESSO:\n');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Senha: ${adminPassword}`);
    console.log(`   Plano: PRO`);
    console.log(`   Role: ADMIN\n`);
    console.log('⚠️  IMPORTANTE: Troque esta senha após o primeiro login!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error.message);
    process.exit(1);
  }
};

createAdmin();
