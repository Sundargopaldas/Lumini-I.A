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

module.exports = router;