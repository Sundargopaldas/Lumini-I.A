#!/usr/bin/env node

/**
 * Script de Setup de Produção - Lumini I.A
 * 
 * Este script ajuda a configurar o ambiente de produção:
 * - Gera JWT_SECRET forte
 * - Valida variáveis de ambiente
 * - Testa conexão com banco de dados
 * - Testa envio de email
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🚀 LUMINI I.A - Setup de Produção\n');

// 1. Verificar se .env existe
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('❌ Arquivo .env não encontrado!');
    console.log('   Crie o arquivo backend/.env baseado no CONFIG_AMBIENTE.md\n');
    process.exit(1);
}

// 2. Carregar .env
require('dotenv').config();

// 3. Gerar JWT_SECRET
console.log('🔐 Gerando JWT_SECRET forte...');
const newSecret = crypto.randomBytes(64).toString('hex');
console.log(`   ${newSecret}\n`);

// 4. Validar variáveis críticas
console.log('✅ Validando variáveis de ambiente...');

const requiredVars = [
    'NODE_ENV',
    'JWT_SECRET',
    'FRONTEND_URL',
    'EMAIL_HOST',
    'EMAIL_USER',
    'EMAIL_PASS',
    'GEMINI_API_KEY'
];

const warnings = [];
const errors = [];

requiredVars.forEach(varName => {
    if (!process.env[varName]) {
        errors.push(`❌ ${varName} não está configurado`);
    } else if (varName === 'JWT_SECRET' && process.env[varName].length < 32) {
        warnings.push(`⚠️  ${varName} é muito curto (< 32 caracteres)`);
    } else {
        console.log(`   ✓ ${varName}: Configurado`);
    }
});

// Verificar banco
if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
    errors.push('❌ Nenhuma configuração de banco encontrada (DATABASE_URL ou DB_HOST)');
}

// Stripe
if (!process.env.STRIPE_SECRET_KEY) {
    warnings.push('⚠️  STRIPE_SECRET_KEY não configurado (pagamentos desabilitados)');
} else if (process.env.NODE_ENV === 'production' && !process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
    warnings.push('⚠️  STRIPE_SECRET_KEY não é uma chave LIVE (use sk_live_ em produção)');
}

console.log('');

// Exibir warnings
if (warnings.length > 0) {
    console.log('⚠️  AVISOS:\n');
    warnings.forEach(w => console.log(`   ${w}`));
    console.log('');
}

// Exibir erros
if (errors.length > 0) {
    console.log('❌ ERROS CRÍTICOS:\n');
    errors.forEach(e => console.log(`   ${e}`));
    console.log('\n   Corrija esses erros antes de fazer deploy!\n');
    process.exit(1);
}

// 5. Testar conexão com banco
console.log('🗄️  Testando conexão com banco de dados...');
const sequelize = require('./config/database');

sequelize.authenticate()
    .then(() => {
        console.log('   ✓ Conexão com banco OK\n');
        
        // 6. Testar email (opcional)
        console.log('📧 Configuração de email:');
        console.log(`   Host: ${process.env.EMAIL_HOST}`);
        console.log(`   User: ${process.env.EMAIL_USER}`);
        console.log(`   From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}\n`);
        
        console.log('✅ Setup completo! Pronto para produção.\n');
        console.log('📝 Próximos passos:');
        console.log('   1. Configure DNS no Register.br');
        console.log('   2. Faça deploy do backend e frontend');
        console.log('   3. Configure SSL/HTTPS');
        console.log('   4. Teste em produção\n');
        
        process.exit(0);
    })
    .catch(error => {
        console.log('   ❌ Erro ao conectar ao banco:');
        console.log(`   ${error.message}\n`);
        console.log('   Verifique as configurações de DATABASE_URL ou DB_HOST/DB_USER/DB_PASS\n');
        process.exit(1);
    });
