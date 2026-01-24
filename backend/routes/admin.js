const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const SystemConfig = require('../models/SystemConfig');
const User = require('../models/User');
const nodemailer = require('nodemailer');

/**
 * Get Logo Path - Tries multiple paths for dev and production
 */
const getLogoPath = () => {
    const possiblePaths = [
        path.join(__dirname, '../public/logo.png'),           // Produção: /app/public/logo.png
        path.join(__dirname, '../../frontend/public/logo.png'), // Dev: frontend/public/logo.png
        path.join(__dirname, '../../public/logo.png')          // Alternativo
    ];
    
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            console.log(`✅ Logo encontrada em: ${p}`);
            return p;
        }
    }
    
    console.warn('⚠️ Logo não encontrada em nenhum caminho esperado');
    return null;
};

// Middleware para verificar se é admin
const adminMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Não autenticado' });
        }

        // Se o token já tiver a info, usa
        if (req.user.isAdmin || req.user.role === 'admin' || (req.user.email && req.user.email.includes('admin'))) {
            return next();
        }

        // Se não, busca no banco para ter certeza (caso o token seja antigo)
        const user = await User.findByPk(req.user.id);
        if (user && user.isAdmin) {
            // Atualiza req.user com a info fresca
            req.user.isAdmin = true;
            return next();
        }

        console.warn(`Tentativa de acesso não autorizado ao Admin: ${req.user.id}`);
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });

    } catch (error) {
        console.error('Erro no adminMiddleware:', error);
        return res.status(500).json({ message: 'Erro interno de servidor' });
    }
};

// GET /api/admin/config - Listar configurações SMTP
router.get('/config/smtp', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const keys = [
            'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SECURE', 'SMTP_FROM'
        ];
        
        const configs = await SystemConfig.findAll({
            where: {
                key: keys
            }
        });

        // Converter array para objeto
        const configMap = {};
        keys.forEach(k => configMap[k] = '');
        
        configs.forEach(c => {
            configMap[c.key] = c.key === 'SMTP_PASS' ? '********' : c.value;
        });

        res.json(configMap);
    } catch (error) {
        console.error('Error fetching SMTP configs:', error);
        res.status(500).json({ message: 'Error fetching configurations' });
    }
});

// POST /api/admin/config/smtp - Atualizar configurações SMTP
router.post('/config/smtp', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, SMTP_FROM } = req.body;
        
        const updates = [];
        
        if (SMTP_HOST) updates.push({ key: 'SMTP_HOST', value: SMTP_HOST });
        if (SMTP_PORT) updates.push({ key: 'SMTP_PORT', value: SMTP_PORT });
        if (SMTP_USER) updates.push({ key: 'SMTP_USER', value: SMTP_USER });
        if (SMTP_SECURE) updates.push({ key: 'SMTP_SECURE', value: SMTP_SECURE });
        if (SMTP_FROM) updates.push({ key: 'SMTP_FROM', value: SMTP_FROM });
        
        // Só atualiza senha se não for a máscara
        if (SMTP_PASS && SMTP_PASS !== '********') {
            // Apenas trim para remover espaços acidentais no início/fim, mantendo espaços internos se houver
            const cleanPass = SMTP_PASS.trim();
            updates.push({ key: 'SMTP_PASS', value: cleanPass });
        }

        for (const update of updates) {
            await SystemConfig.upsert(update);
        }

        res.json({ message: 'Configurações SMTP atualizadas com sucesso.' });
    } catch (error) {
        console.error('Error updating SMTP config:', error);
        res.status(500).json({ message: 'Error updating configuration' });
    }
});

// POST /api/admin/config/smtp/test - Testar configurações SMTP
router.post('/config/smtp/test', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        let { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, SMTP_FROM } = req.body;

        if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
            return res.status(400).json({ message: 'Preencha todos os campos obrigatórios para testar.' });
        }

        // If password is masked, fetch real password from DB
        if (SMTP_PASS === '********') {
            const savedPass = await SystemConfig.findOne({ where: { key: 'SMTP_PASS' } });
            if (savedPass && savedPass.value) {
                SMTP_PASS = savedPass.value;
            } else {
                return res.status(400).json({ message: 'Senha não encontrada. Salve as configurações primeiro.' });
            }
        }

        console.log(`Testando SMTP: Host=${SMTP_HOST}, Port=${SMTP_PORT}, User=${SMTP_USER}, Secure=${SMTP_SECURE}`);

        const transporter = nodemailer.createTransport({
            host: SMTP_HOST.trim(),
            port: parseInt(SMTP_PORT),
            secure: SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: SMTP_USER.trim(),
                pass: SMTP_PASS ? SMTP_PASS.trim() : '',
            },
            tls: {
                rejectUnauthorized: false // Helps with self-signed certs in development
            },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 5000,
            socketTimeout: 10000
        });

        // Verify connection configuration
        console.log('Verificando conexão...');
        await transporter.verify();
        console.log('Conexão verificada com sucesso!');

        // Get current user email if not in req.user
        let userEmail = req.user.email;
        if (!userEmail) {
            const currentUser = await User.findByPk(req.user.id);
            if (currentUser) {
                userEmail = currentUser.email;
            }
        }

        if (!userEmail) {
            throw new Error('Não foi possível identificar o e-mail do administrador para envio do teste.');
        }

        // Send a test email to the logged in admin
        const logoPath = getLogoPath();
        const attachments = [];
        let htmlContent = '<p>Se você recebeu este e-mail, sua <b>configuração SMTP</b> está funcionando corretamente.</p>';

        if (logoPath) {
            attachments.push({
                filename: 'logo.png',
                path: logoPath,
                cid: 'logo' // same cid value as in the html img src
            });
            htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="cid:logo" alt="Lumini I.A" style="width: 150px; height: auto;">
                    </div>
                    <h2 style="color: #4a5568; text-align: center;">Teste de Conexão Bem-sucedido!</h2>
                    <p style="color: #718096; text-align: center;">Sua configuração de e-mail está funcionando perfeitamente.</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #a0aec0; text-align: center;">
                        Enviado pelo sistema Lumini I.A em ${new Date().toLocaleString('pt-BR')}
                    </p>
                </div>
            `;
        }

        const mailOptions = {
            from: SMTP_FROM || SMTP_USER,
            to: userEmail, // Send to the admin triggering the test
            subject: 'Teste de Configuração SMTP - Lumini IA',
            text: 'Se você recebeu este e-mail, sua configuração SMTP está funcionando corretamente.',
            html: htmlContent,
            attachments: attachments
        };

        console.log(`Enviando email de teste para: ${userEmail}`);
        await transporter.sendMail(mailOptions);
        console.log('Email enviado com sucesso!');

        res.json({ message: 'Conexão SMTP verificada com sucesso! Um e-mail de teste foi enviado para ' + userEmail });
    } catch (error) {
        console.error('DETAILED SMTP TEST ERROR:', JSON.stringify(error, null, 2));
        
        let errorMessage = 'Falha na conexão SMTP: ' + error.message;
        
        if (error.code === 'EAUTH') {
            errorMessage = 'Erro de Autenticação: Usuário ou senha incorretos. Verifique se a Senha de App está correta.';
        } else if (error.code === 'ESOCKET') {
            errorMessage = 'Erro de Conexão: Verifique o Host e a Porta. Pode ser um bloqueio de firewall no servidor.';
        } else if (error.message.includes('timed out')) {
            errorMessage = 'Erro de Timeout: A conexão demorou demais para responder. Verifique o Host e a Porta, e se o servidor de e-mail está online.';
        }
        
        res.status(400).json({ message: errorMessage });
    }
});

// ROTA TEMPORÁRIA: Promover usuário para Premium (SEM AUTH para facilitar)
router.post('/promote-to-premium-temp', async (req, res) => {
    try {
        // Email fixo para segurança
        const email = 'contato@luminiiadigital.com.br';
        
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        
        const oldPlan = user.plan;
        user.plan = 'premium';
        await user.save();
        
        res.json({ 
            message: `Usuário promovido de ${oldPlan} para premium com sucesso!`,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                oldPlan,
                newPlan: user.plan
            }
        });
    } catch (error) {
        console.error('Erro ao promover usuário:', error);
        res.status(500).json({ message: 'Erro ao promover usuário: ' + error.message });
    }
});

// GET /api/admin/email-status - Verificar status das configurações de email
router.get('/email-status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        console.log('\n🔍 [EMAIL-STATUS] Verificando configurações de email...');
        
        const status = {
            env: {
                EMAIL_HOST: process.env.EMAIL_HOST || '❌ NÃO CONFIGURADO',
                EMAIL_PORT: process.env.EMAIL_PORT || '❌ NÃO CONFIGURADO',
                EMAIL_USER: process.env.EMAIL_USER || '❌ NÃO CONFIGURADO',
                EMAIL_PASS: process.env.EMAIL_PASS ? '✅ CONFIGURADO (oculto)' : '❌ NÃO CONFIGURADO',
                EMAIL_FROM: process.env.EMAIL_FROM || '❌ NÃO CONFIGURADO',
                EMAIL_SECURE: process.env.EMAIL_SECURE || 'false'
            },
            db: {},
            ready: false,
            errors: []
        };

        // Verificar configurações no banco
        try {
            const dbConfigs = await SystemConfig.findAll({
                where: {
                    key: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SECURE', 'SMTP_FROM']
                }
            });
            
            dbConfigs.forEach(config => {
                if (config.key === 'SMTP_PASS') {
                    status.db[config.key] = config.value ? '✅ CONFIGURADO (oculto)' : '❌ NÃO CONFIGURADO';
                } else {
                    status.db[config.key] = config.value || '❌ NÃO CONFIGURADO';
                }
            });
        } catch (dbError) {
            status.errors.push('Erro ao ler banco de dados: ' + dbError.message);
        }

        // Verificar se está pronto
        const hasEnvConfig = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS;
        const hasDbConfig = status.db.SMTP_HOST && status.db.SMTP_USER && status.db.SMTP_PASS;
        
        status.ready = hasEnvConfig || hasDbConfig;
        status.source = hasDbConfig ? 'database' : hasEnvConfig ? 'environment' : 'none';

        if (!status.ready) {
            status.errors.push('⚠️ Nenhuma configuração de email encontrada! Configure em Admin > Configurações do Sistema');
        }

        console.log('✅ [EMAIL-STATUS] Status:', JSON.stringify(status, null, 2));
        
        return res.json(status);
    } catch (error) {
        console.error('❌ [EMAIL-STATUS] Erro:', error);
        return res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/email-raw-check - Verificação DIRETA das ENV vars (SEM AUTH - TEMPORÁRIO)
router.get('/email-raw-check', async (req, res) => {
    console.log('🔍 [RAW CHECK] Verificação DIRETA das variáveis de ambiente:');
    
    // TEST NODEMAILER IMPORT
    let nodemailerTest = {};
    try {
        const nodemailer = require('nodemailer');
        nodemailerTest = {
            imported: true,
            type: typeof nodemailer,
            hasCreateTransporter: typeof nodemailer.createTransporter === 'function',
            keys: Object.keys(nodemailer).join(', '),
            version: nodemailer.createTransport ? 'old API (createTransport)' : nodemailer.createTransporter ? 'new API (createTransporter)' : 'unknown'
        };
    } catch (e) {
        nodemailerTest = {
            imported: false,
            error: e.message
        };
    }
    
    const rawCheck = {
        EMAIL_HOST: process.env.EMAIL_HOST || '❌ VAZIO',
        EMAIL_PORT: process.env.EMAIL_PORT || '❌ VAZIO',
        EMAIL_USER: process.env.EMAIL_USER || '❌ VAZIO',
        EMAIL_PASS: process.env.EMAIL_PASS ? '✅ ********' : '❌ VAZIO',
        EMAIL_FROM: process.env.EMAIL_FROM || '❌ VAZIO',
        EMAIL_SECURE: process.env.EMAIL_SECURE || '❌ VAZIO',
        NODE_ENV: process.env.NODE_ENV || '❌ VAZIO',
        timestamp: new Date().toISOString(),
        flyRegion: process.env.FLY_REGION || 'local',
        flyAppName: process.env.FLY_APP_NAME || 'local'
    };
    
    console.log('📧 Variáveis RAW:', JSON.stringify(rawCheck, null, 2));
    console.log('📦 Nodemailer Test:', JSON.stringify(nodemailerTest, null, 2));
    
    res.json({
        message: '🔍 Verificação DIRETA das variáveis de ambiente (RAW CHECK)',
        variables: rawCheck,
        nodemailer: nodemailerTest,
        isComplete: !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS),
        warning: '⚠️ Este endpoint é TEMPORÁRIO e será removido após diagnóstico'
    });
});

// POST /api/admin/test-email - Testar envio de email (diagnóstico)
router.post('/test-email', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { testEmail } = req.body;
        
        if (!testEmail) {
            return res.status(400).json({ message: 'Email de teste não fornecido' });
        }

        console.log(`\n🧪 === TESTE DE EMAIL INICIADO ===`);
        console.log(`📧 Destinatário: ${testEmail}`);
        
        // Verificar variáveis de ambiente
        const emailConfig = {
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS ? '****** (configurado)' : null,
            from: process.env.EMAIL_FROM,
            secure: process.env.EMAIL_SECURE
        };
        
        console.log('📋 Config:', JSON.stringify(emailConfig, null, 2));

        if (!emailConfig.host || !emailConfig.user || !emailConfig.pass) {
            console.error('❌ Configuração incompleta!');
            return res.status(500).json({ 
                message: 'Configuração de email incompleta', 
                config: emailConfig 
            });
        }

        // Criar transporter
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        console.log('🔧 Transporter criado');

        // Verificar conexão
        console.log('🔍 Verificando conexão SMTP...');
        await transporter.verify();
        console.log('✅ Conexão SMTP OK!');

        // Enviar email
        console.log('📬 Enviando email...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || `"Lumini I.A" <${process.env.EMAIL_USER}>`,
            to: testEmail,
            subject: '✅ Teste de Email - Lumini I.A',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #8b5cf6;">✅ Sistema de Email Funcionando!</h2>
                    <p>Este é um email de teste do sistema Lumini I.A.</p>
                    <p><strong>Se você recebeu este email, o sistema está funcionando corretamente!</strong></p>
                    <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 14px;">
                        Data: ${new Date().toLocaleString('pt-BR')}<br>
                        Servidor: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}<br>
                        De: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}
                    </p>
                </div>
            `
        });

        console.log('✅ Email enviado!');
        console.log('📨 Message ID:', info.messageId);

        return res.json({ 
            success: true,
            message: 'Email enviado com sucesso! Verifique sua caixa de entrada e SPAM.',
            messageId: info.messageId,
            config: {
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER
            }
        });

    } catch (error) {
        console.error('❌ ERRO:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Erro ao enviar email: ' + error.message,
            error: error.toString(),
            code: error.code
        });
    }
});

// POST /api/admin/clear-smtp-db - Limpar configurações SMTP do banco (usar apenas ENV)
router.post('/clear-smtp-db', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        console.log('🧹 Limpando configurações SMTP antigas do banco...');
        
        const deleted = await SystemConfig.destroy({
            where: {
                key: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SECURE', 'SMTP_FROM']
            }
        });

        console.log(`✅ ${deleted} configurações SMTP removidas do banco`);
        console.log('🎯 Agora o sistema vai usar APENAS as variáveis de ambiente!');
        
        res.json({ 
            success: true,
            message: `${deleted} configurações SMTP removidas do banco. Agora o sistema usará apenas as variáveis de ambiente do Fly.io.`,
            deletedCount: deleted,
            activeConfig: {
                EMAIL_HOST: process.env.EMAIL_HOST || 'N/A',
                EMAIL_PORT: process.env.EMAIL_PORT || 'N/A',
                EMAIL_USER: process.env.EMAIL_USER || 'N/A',
                EMAIL_FROM: process.env.EMAIL_FROM || 'N/A'
            }
        });
    } catch (error) {
        console.error('❌ Erro ao limpar configs SMTP:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erro ao limpar configurações SMTP',
            error: error.message
        });
    }
});

// DELETE user by email (TEMPORARY - for testing)
router.delete('/users/:email', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { email } = req.params;
        console.log(`🗑️ [ADMIN] Tentando deletar usuário: ${email}`);
        
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            console.log(`❌ [ADMIN] Usuário não encontrado: ${email}`);
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }
        
        console.log(`✅ [ADMIN] Usuário encontrado:`, {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name
        });
        
        await user.destroy();
        console.log(`✅ [ADMIN] Usuário deletado com sucesso: ${email}`);
        
        res.json({ 
            success: true, 
            message: 'Usuário deletado com sucesso',
            email: email
        });
    } catch (error) {
        console.error('❌ [ADMIN] Erro ao deletar usuário:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erro ao deletar usuário',
            error: error.message
        });
    }
});

module.exports = router;