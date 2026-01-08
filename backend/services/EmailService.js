const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const SystemConfig = require('../models/SystemConfig');

/**
 * Get Transporter - Dynamically loads SMTP config from DB or Env
 */
const getTransporter = async () => {
    try {
        // Try to get from DB first
        const configs = await SystemConfig.findAll({
            where: {
                key: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SECURE']
            }
        });
        
        const configMap = {};
        configs.forEach(c => configMap[c.key] = c.value);

        // Determine effective config (DB overrides Env)
        const host = configMap['SMTP_HOST'] || process.env.EMAIL_HOST;
        
        // If no host configured anywhere, return null
        if (!host) return null;

        const port = configMap['SMTP_PORT'] || process.env.EMAIL_PORT || 587;
        const secure = (configMap['SMTP_SECURE'] === 'true') || (process.env.EMAIL_SECURE === 'true') || false;
        const user = configMap['SMTP_USER'] || process.env.EMAIL_USER;
        const pass = configMap['SMTP_PASS'] || process.env.EMAIL_PASS;

        return nodemailer.createTransport({
            host,
            port: parseInt(port),
            secure,
            auth: { user, pass }
        });

    } catch (error) {
        console.error('Error loading SMTP config, falling back to env:', error);
        // Fallback to Env if DB fails
        if (!process.env.EMAIL_HOST) return null;
        
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
};

/**
 * Get From Address
 */
const getFromAddress = async () => {
    try {
        const config = await SystemConfig.findOne({ where: { key: 'SMTP_FROM' } });
        return config?.value || process.env.EMAIL_FROM || `"Equipe Lumini I.A" <contato@luminiiadigital.com.br>`;
    } catch (e) {
        return process.env.EMAIL_FROM || `"Equipe Lumini I.A" <contato@luminiiadigital.com.br>`;
    }
};

/**
 * Send Cancellation Confirmation Email
 * @param {Object} user - User object containing email and name
 * @param {String} reason - Reason for cancellation provided by user
 */
const sendCancellationEmail = async (user, reason) => {
    console.log(`[EmailService] sendCancellationEmail called for: ${user.email}`);
    if (!user.email) return;

    const transporter = await getTransporter();
    if (!transporter) {
        console.warn('Email not sent: SMTP not configured');
        return;
    }

    const fromAddress = await getFromAddress();
    
    const logoPath = path.join(__dirname, '../../frontend/public/logo.png');
    const attachments = [];
    if (fs.existsSync(logoPath)) {
        attachments.push({
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo'
        });
    }

    const mailOptions = {
        from: fromAddress,
        to: user.email,
        subject: 'Confirmação de Cancelamento de Assinatura',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="cid:logo" alt="Lumini I.A" style="width: 50px; height: 50px;">
                </div>
                <h2 style="color: #4a5568;">Cancelamento Recebido</h2>
                <p>Olá, ${user.name || 'Usuário'},</p>
                <p>Recebemos sua solicitação de cancelamento da assinatura <strong>Lumini I.A</strong>.</p>
                <p>Sua assinatura permanecerá ativa até o final do período de cobrança atual. Após essa data, sua conta retornará ao plano Gratuito.</p>
                
                ${reason ? `<p><strong>Motivo informado:</strong> ${reason}</p>` : ''}
                
                <p>Sentimos muito em ver você partir. Se houver algo que possamos fazer para melhorar sua experiência, por favor, responda a este e-mail.</p>
                
                <p>Atenciosamente,<br>Equipe Lumini I.A</p>
            </div>
        `,
        attachments: attachments
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Cancellation email sent to ${user.email}`);
        
        // Also send notification to Admin
        const adminMailOptions = {
            from: `"System Bot" <${(await getFromAddress()).match(/<(.+)>/)?.[1] || 'bot@lumini.ai'}>`,
            to: process.env.SUPPORT_EMAIL || 'admin@lumini.ai', // Send to support email or admin
            subject: `[CANCELAMENTO] Usuário ${user.name} cancelou assinatura`,
            html: `
                <h3>Novo Cancelamento</h3>
                <p><strong>Usuário:</strong> ${user.name} (${user.email})</p>
                <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                <p><strong>Motivo:</strong> ${reason || 'Não informado'}</p>
            `
        };
        await transporter.sendMail(adminMailOptions);
        console.log(`Cancellation notification sent to admin`);

    } catch (error) {
        console.error('Error sending cancellation email:', error);
    }
};

/**
 * Send Welcome Email (Premium/Pro)
 */
const sendWelcomeEmail = async (user, planName) => {
    if (!user.email) return;

    const transporter = await getTransporter();
    if (!transporter) return;
    const fromAddress = await getFromAddress();

    const logoPath = path.join(__dirname, '../../frontend/public/logo.png');
    const attachments = [];
    if (fs.existsSync(logoPath)) {
        attachments.push({
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo'
        });
    }

    const mailOptions = {
        from: fromAddress,
        to: user.email,
        subject: 'Bem-vindo(a) ao Lumini I.A Premium! 🚀',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background: #6d28d9; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <img src="cid:logo" alt="Lumini I.A" style="width: 80px; height: auto; margin-bottom: 10px;">
                    <h1 style="color: white; margin: 0;">Bem-vindo ao Lumini I.A!</h1>
                </div>
                <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <p>Olá, <strong>${user.name || 'Creator'}</strong>!</p>
                    
                    <p>Obrigado por assinar o plano <strong>${planName}</strong>. Estamos muito felizes em ter você conosco nessa jornada de crescimento.</p>
                    
                    <p>Agora você tem acesso a ferramentas exclusivas para profissionalizar sua carreira:</p>
                    <ul>
                        <li>Gestão financeira completa</li>
                        <li>Relatórios avançados</li>
                        <li>Emissão de Notas Fiscais (NFS-e)</li>
                        <li>E muito mais...</li>
                    </ul>

                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Painel Agora</a>
                    </p>

                    <p>Se tiver qualquer dúvida, nossa equipe de suporte está pronta para ajudar.</p>
                    
                    <p>Sucesso,<br>Equipe Lumini I.A</p>
                </div>
            </div>
        `,
        attachments: attachments
    };

    try {
        console.log(`[EmailService] Sending Welcome Email to ${user.email} for plan ${planName}`);
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
};

/**
 * Send Password Reset Email
 * @param {Object} user - User object containing email
 * @param {String} resetLink - The reset password link
 */
const sendPasswordResetEmail = async (user, resetLink) => {
    if (!user.email) return;

    const transporter = await getTransporter();
    if (!transporter) return;
    const fromAddress = await getFromAddress();

    const logoPath = path.join(__dirname, '../../frontend/public/logo.png');
    const attachments = [];
    if (fs.existsSync(logoPath)) {
        attachments.push({
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo'
        });
    }

    const mailOptions = {
        from: fromAddress,
        to: user.email,
        subject: 'Redefinição de Senha - Lumini I.A',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <div style="background: linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                  <img src="cid:logo" alt="Lumini I.A" style="width: 60px; height: 60px; margin-bottom: 10px; display: inline-block;">
                  <h2 style="color: white; margin: 0;">Redefinição de Senha</h2>
              </div>
              <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; background-color: white;">
                  <p style="font-size: 16px;">Olá, <strong>${user.name || user.username || 'Usuário'}</strong>,</p>
                  <p style="line-height: 1.6;">Você solicitou a redefinição de sua senha na plataforma Lumini I.A.</p>
                  <p>Clique no botão abaixo para criar uma nova senha:</p>
                  <p style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Redefinir Senha</a>
                  </p>
                  <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
                  <p style="word-break: break-all; color: #6d28d9;">${resetLink}</p>
                  <p style="font-size: 12px; color: #666; margin-top: 30px;">Este link expira em 1 hora.</p>
                  <p>Se você não solicitou isso, pode ignorar este e-mail.</p>
              </div>
            </div>
        `,
        attachments: attachments
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error; // Propagate error so controller knows
    }
};

/**
 * Send Invoice Email (Payment Received)
 * @param {Object} user - User object containing email and name
 * @param {Object} invoiceData - Details of the invoice/payment
 */
const sendInvoiceEmail = async (user, invoiceData) => {
    if (!user.email) return;

    const transporter = await getTransporter();
    if (!transporter) return;
    const fromAddress = await getFromAddress();

    const logoPath = path.join(__dirname, '../../frontend/public/logo.png');
    const attachments = [];
    if (fs.existsSync(logoPath)) {
        attachments.push({
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo'
        });
    }

    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;

    const mailOptions = {
        from: fromAddress,
        to: user.email,
        subject: 'Fatura Paga com Sucesso! ✅',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background: #10b981; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <img src="cid:logo" alt="Lumini I.A" style="width: 60px; height: auto; margin-bottom: 10px;">
                    <h2 style="color: white; margin: 0;">Pagamento Confirmado</h2>
                </div>
                <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; background-color: white;">
                    <p>Olá, <strong>${user.name || 'Cliente'}</strong>,</p>
                    <p>Recebemos o pagamento da sua fatura. Seu acesso aos recursos premium continua ativo!</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Descrição:</strong> ${invoiceData.description || 'Assinatura Lumini I.A'}</p>
                        <p style="margin: 5px 0;"><strong>Valor:</strong> ${invoiceData.amount}</p>
                        <p style="margin: 5px 0;"><strong>Data:</strong> ${invoiceData.date || new Date().toLocaleDateString('pt-BR')}</p>
                        <p style="margin: 5px 0;"><strong>Forma de Pagamento:</strong> ${invoiceData.method || 'Cartão/Boleto'}</p>
                    </div>

                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${dashboardUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Painel</a>
                    </p>
                    
                    <p style="font-size: 12px; color: #666; margin-top: 30px;">Esta é uma mensagem automática, por favor não responda.</p>
                </div>
            </div>
        `,
        attachments: attachments
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Invoice email sent to ${user.email}`);
    } catch (error) {
        console.error('Error sending invoice email:', error);
    }
};

/**
 * Send Invitation Email to Accountant
 * @param {Object} inviter - User object sending the invite
 * @param {String} email - Accountant email
 */
const sendInviteEmail = async (inviter, email) => {
    const transporter = await getTransporter();
    if (!transporter) return;
    const fromAddress = await getFromAddress();

    const logoPath = path.join(__dirname, '../../frontend/public/logo.png');
    const attachments = [];
    if (fs.existsSync(logoPath)) {
        attachments.push({
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo'
        });
    }

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?role=accountant&ref=${inviter.id}`;
    
    const mailOptions = {
        from: fromAddress,
        to: email,
        subject: `Convite: ${inviter.name || 'Um cliente'} convidou você para o Lumini I.A`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #2563eb; padding: 30px; text-align: center;">
                    <img src="cid:logo" alt="Lumini I.A" style="width: 50px; height: auto; vertical-align: middle; margin-right: 12px;">
                    <span style="color: white; font-size: 26px; font-weight: bold; vertical-align: middle;">Lumini I.A</span>
                    <h1 style="color: white; margin: 25px 0 0 0; font-size: 24px;">Você recebeu um convite!</h1>
                </div>
                
                <div style="padding: 30px; background-color: white;">
                    <p style="font-size: 16px; color: #4a5568;">Olá,</p>
                    
                    <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">
                        <strong>${inviter.name || inviter.email}</strong> está usando o Lumini I.A para gerenciar suas finanças e gostaria de compartilhar o acesso aos dados fiscais com você.
                    </p>
                    
                    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #1e40af; font-weight: 500;">O Lumini I.A facilita a conexão entre criadores de conteúdo e contadores, automatizando o acesso a notas fiscais e relatórios financeiros.</p>
                    </div>
                    
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.25);">
                            Aceitar Convite e Criar Conta
                        </a>
                    </div>

                    <p style="color: #718096; font-size: 14px; text-align: center;">
                        Se você já possui uma conta como contador, basta acessar sua conta para ver o convite.
                    </p>
                </div>
                
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} Lumini I.A. Todos os direitos reservados.</p>
                </div>
            </div>
        `,
        attachments: attachments
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Invite email sent to ${email}`);
    } catch (error) {
        console.error('Error sending invite email:', error);
    }
};

/**
 * Send Notification to Accountant about New Client Link
 * @param {Object} client - User object (client)
 * @param {String} accountantEmail - Accountant email
 */
const sendNewClientNotification = async (client, accountantEmail) => {
    const transporter = await getTransporter();
    if (!transporter) return;
    const fromAddress = await getFromAddress();

    const logoPath = path.join(__dirname, '../../frontend/public/logo.png');
    const attachments = [];
    if (fs.existsSync(logoPath)) {
        attachments.push({
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo'
        });
    }

    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accountant-dashboard`;

    const mailOptions = {
        from: fromAddress,
        to: accountantEmail,
        subject: `Novo Cliente Vinculado: ${client.name || 'Um novo cliente'}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #2563eb; padding: 30px; text-align: center;">
                    <img src="cid:logo" alt="Lumini I.A" style="width: 50px; height: auto; vertical-align: middle; margin-right: 12px;">
                    <span style="color: white; font-size: 26px; font-weight: bold; vertical-align: middle;">Lumini I.A</span>
                    <h1 style="color: white; margin: 25px 0 0 0; font-size: 24px;">Novo Cliente Vinculado!</h1>
                </div>
                
                <div style="padding: 30px; background-color: white;">
                    <p style="font-size: 16px; color: #4a5568;">Olá,</p>
                    
                    <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">
                        O cliente <strong>${client.name || client.email}</strong> acabou de vincular o perfil dele ao seu escritório no Lumini I.A.
                    </p>
                    
                    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #1e40af; font-weight: 500;">Agora você tem acesso aos dados fiscais e relatórios financeiros deste cliente.</p>
                    </div>
                    
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="${dashboardUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.25);">
                            Acessar Painel do Contador
                        </a>
                    </div>
                </div>
                
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} Lumini I.A. Todos os direitos reservados.</p>
                </div>
            </div>
        `,
        attachments: attachments
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`New client notification sent to ${accountantEmail}`);
    } catch (error) {
        console.error('Error sending new client notification:', error);
    }
};

module.exports = {
    sendCancellationEmail,
    sendInvoiceEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendInviteEmail,
    sendNewClientNotification
};
