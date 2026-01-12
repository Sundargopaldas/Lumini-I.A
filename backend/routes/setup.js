const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Endpoint GET para facilitar acesso via navegador
// SEGURANÇA: Só permite criar admin se não houver nenhum admin no sistema
router.get('/create-admin', async (req, res) => {
  try {
    // PROTEÇÃO: Verificar se já existe algum admin no sistema
    const adminCount = await User.count({ where: { isAdmin: true } });
    if (adminCount > 0) {
      return res.status(403).json({ 
        success: false,
        message: '❌ ACESSO NEGADO: Já existe um administrador no sistema.',
        security: 'Esta rota só pode ser usada na primeira configuração do sistema.'
      });
    }
    
    const adminEmail = 'admin@luminiiadigital.com.br';
    
    // Verificar se já existe o usuário (mas sem ser admin)
    const existing = await User.findOne({ where: { email: adminEmail } });
    if (existing) {
      // Atualizar para garantir que é admin
      existing.isAdmin = true;
      existing.plan = 'pro';
      await existing.save();
      
      return res.json({ 
        success: true,
        message: 'Admin atualizado com sucesso!',
        email: adminEmail,
        isAdmin: existing.isAdmin,
        plan: existing.plan,
        instructions: 'Faça logout e login novamente para ver o painel Admin'
      });
    }
    
    // Criar admin se não existe
    const hashedPassword = await bcrypt.hash('Lumini@Admin2026', 10);
    const admin = await User.create({
      username: 'Administrador Lumini',
      email: adminEmail,
      password: hashedPassword,
      plan: 'pro',
      isAdmin: true
    });
    
    res.json({
      success: true,
      message: 'Admin criado com sucesso!',
      credentials: {
        email: adminEmail,
        password: 'Lumini@Admin2026',
        plan: 'pro'
      },
      instructions: 'Faça login com estas credenciais'
    });
  } catch (error) {
    console.error('Erro ao criar admin:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para criar admin - POST
// SEGURANÇA: Só permite criar admin se não houver nenhum admin no sistema
router.post('/create-admin', async (req, res) => {
  try {
    // PROTEÇÃO: Verificar se já existe algum admin no sistema
    const adminCount = await User.count({ where: { isAdmin: true } });
    if (adminCount > 0) {
      return res.status(403).json({ 
        success: false,
        message: '❌ ACESSO NEGADO: Já existe um administrador no sistema.',
        security: 'Esta rota só pode ser usada na primeira configuração do sistema.'
      });
    }
    
    const adminEmail = 'admin@luminiiadigital.com.br';
    
    // Verificar se já existe o usuário (mas sem ser admin)
    const existing = await User.findOne({ where: { email: adminEmail } });
    if (existing) {
      // Atualizar para garantir que é admin
      existing.isAdmin = true;
      existing.plan = 'pro';
      await existing.save();
      
      return res.json({ 
        success: true,
        message: 'Admin já existia e foi atualizado',
        email: adminEmail,
        isAdmin: existing.isAdmin,
        plan: existing.plan
      });
    }
    
    // Criar admin
    const hashedPassword = await bcrypt.hash('Lumini@Admin2026', 10);
    const admin = await User.create({
      username: 'Administrador Lumini',
      email: adminEmail,
      password: hashedPassword,
      plan: 'pro',
      isAdmin: true
    });
    
    res.json({
      success: true,
      message: 'Admin criado com sucesso!',
      credentials: {
        email: adminEmail,
        password: 'Lumini@Admin2026',
        plan: 'pro'
      }
    });
  } catch (error) {
    console.error('Erro ao criar admin:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
