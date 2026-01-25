const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const SystemConfig = require('../models/SystemConfig');
const { decrypt } = require('../utils/encryption');

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

/**
 * Get Transporter - Dynamically loads SMTP config from DB or Env
 * PRIORITY: ENV vars ALWAYS take priority over DB (to prevent old configs)
 */
const getTransporter = async () => {
    try {
        // ALWAYS prioritize ENV vars over DB to prevent old configs
        const host = process.env.EMAIL_HOST;
        
        // If no host configured, return null
        if (!host) {
            console.warn('⚠️ EMAIL_HOST not configured');
            return null;
        }

        const port = process.env.EMAIL_PORT || 587;
        const secure = process.env.EMAIL_SECURE === 'true';
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;

        console.log(`📧 [EmailService] Creating transporter with config:`);
        console.log(`   Host: ${host}`);
        console.log(`   Port: ${port}`);
        console.log(`   Secure: ${secure}`);
        console.log(`   User: ${user}`);
        console.log(`   Pass: ${pass ? '✅ Configured' : '❌ Missing'}`);

        const transporter = nodemailer.createTransport({
            host,
            port: parseInt(port),
            secure,
            auth: { user, pass },
            debug: true, // Enable detailed SMTP logs
            logger: true
        });

        // VERIFY CONNECTION BEFORE RETURNING
        console.log('🔍 [EmailService] Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ [EmailService] SMTP connection verified successfully!');

        return transporter;

    } catch (error) {
        console.error('❌ [EmailService] ERROR creating/verifying transporter:', error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        console.error('   Error command:', error.command);
        return null;
    }
};

/**
 * Get From Address - ALWAYS use ENV
 */
const getFromAddress = async () => {
    return process.env.EMAIL_FROM || `"Equipe Lumini I.A" <contato@luminiiadigital.com.br>`;
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
    
    const logoPath = getLogoPath();
    const attachments = [];
    if (logoPath) {
        attachments.push({
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo'
        });
    }

    const mailOptions = {
        from: fromAddress,
        to: user.email,
        subject: 'Confirmação de Cancelamento - Lumini I.A',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background: #6d28d9; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <img src="cid:logo" alt="Lumini I.A" style="width: 80px; height: auto; margin-bottom: 10px;">
                    <h1 style="color: white; margin: 0;">Cancelamento Recebido</h1>
                </div>
                <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <p>Olá, <strong>${user.name || 'Usuário'}</strong>,</p>
                    
                    <p>Recebemos sua solicitação de cancelamento da assinatura <strong>Lumini I.A</strong>.</p>
                    
                    <p>Sua assinatura permanecerá ativa até o final do período de cobrança atual. Após essa data, sua conta retornará ao plano Gratuito.</p>
                    
                    ${reason ? `
                    <div style="background-color: #f3f4f6; border-left: 4px solid #6d28d9; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #4a5568;"><strong>Motivo informado:</strong></p>
                        <p style="margin: 10px 0 0 0; color: #6b7280;">${reason}</p>
                    </div>
                    ` : ''}
                    
                    <p>Sentimos muito em ver você partir. Se houver algo que possamos fazer para melhorar sua experiência, por favor, responda a este e-mail.</p>
                    
                    <p>Atenciosamente,<br>Equipe Lumini I.A</p>
                </div>
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

    const logoPath = getLogoPath();
    const attachments = [];
    if (logoPath) {
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
 * Send Email Verification Email
 * @param {Object} user - User object containing email
 * @param {String} verificationLink - The email verification link
 */
const sendVerificationEmail = async (user, verificationLink) => {
    console.log('\n🚀 ===== EMAIL VERIFICATION START =====');
    console.log(`📧 Target: ${user.email}`);
    console.log(`🔗 Verification Link: ${verificationLink}`);
    
    if (!user.email) {
        console.warn('⚠️ No email provided, aborting');
        return;
    }

    console.log('📞 Calling getTransporter()...');
    const transporter = await getTransporter();
    
    if (!transporter) {
        console.error('❌ TRANSPORTER IS NULL! Email cannot be sent.');
        throw new Error('SMTP não configurado ou falha na verificação da conexão');
    }
    
    console.log('✅ Transporter OK, getting FROM address...');
    const fromAddress = await getFromAddress();
    console.log(`📤 From: ${fromAddress}`);

    const logoPath = getLogoPath();
    const attachments = [];
    if (logoPath) {
        attachments.push({
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo'
        });
    }

    // Usar cid:logo se o attachment estiver disponível, senão usar URL externa
    const logoImg = logoPath 
        ? '<img src="cid:logo" alt="Lumini I.A" style="width: 60px; height: 60px; margin-bottom: 10px; display: inline-block; background-color: white; padding: 8px; border-radius: 8px;">'
        : '<img src="https://www.luminiiadigital.com.br/logo.png" alt="Lumini I.A" style="width: 60px; height: 60px; margin-bottom: 10px; display: inline-block; background-color: white; padding: 8px; border-radius: 8px;">';

    const mailOptions = {
        from: fromAddress,
        to: user.email,
        subject: 'Confirme seu Cadastro - Lumini I.A',
        attachments: attachments.length > 0 ? attachments : undefined,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <div style="background: linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                  ${logoImg}
                  <h2 style="color: white; margin: 0;">Bem-vindo ao Lumini I.A!</h2>
              </div>
              <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; background-color: white;">
                  <p style="font-size: 16px;">Olá, <strong>${user.name || user.username || 'Usuário'}</strong>,</p>
                  <p style="line-height: 1.6;">Você se cadastrou no <strong>Lumini I.A</strong>, a plataforma completa de gestão financeira para criadores de conteúdo!</p>
                  <p>Para começar a usar todas as funcionalidades, por favor confirme seu email clicando no botão abaixo:</p>
                  <p style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Confirmar meu Email</a>
                  </p>
                  <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
                  <p style="word-break: break-all; color: #6d28d9;">${verificationLink}</p>
                  <p style="font-size: 12px; color: #666; margin-top: 30px;">Este link expira em 24 horas.</p>
                  <p>Se você não se cadastrou no Lumini I.A, pode ignorar este e-mail.</p>
              </div>
            </div>
        `
    };

    try {
        console.log('📨 Sending verification email with nodemailer...');
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ ===== VERIFICATION EMAIL SENT SUCCESSFULLY =====');
        console.log(`📧 Message ID: ${info.messageId}`);
        console.log(`📬 Response: ${info.response}`);
        console.log(`📧 Email sent to: ${user.email}`);
        console.log('===================================\n');
    } catch (error) {
        console.error('❌ ===== VERIFICATION EMAIL SEND FAILED =====');
        console.error('Error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('================================\n');
        throw error;
    }
};

/**
 * Send Password Reset Email
 * @param {Object} user - User object containing email
 * @param {String} resetLink - The reset password link
 */
const sendPasswordResetEmail = async (user, resetLink) => {
    console.log('\n🚀 ===== PASSWORD RESET EMAIL START =====');
    console.log(`📧 Target: ${user.email}`);
    console.log(`🔗 Reset Link: ${resetLink}`);
    
    if (!user.email) {
        console.warn('⚠️ No email provided, aborting');
        return;
    }

    console.log('📞 Calling getTransporter()...');
    const transporter = await getTransporter();
    
    if (!transporter) {
        console.error('❌ TRANSPORTER IS NULL! Email cannot be sent.');
        throw new Error('SMTP não configurado ou falha na verificação da conexão');
    }
    
    console.log('✅ Transporter OK, getting FROM address...');
    const fromAddress = await getFromAddress();
    console.log(`📤 From: ${fromAddress}`);

    // Tentar múltiplos caminhos para a logo (dev e produção)
    const possibleLogoPaths = [
        path.join(__dirname, '../public/logo.png'),           // Produção: /app/public/logo.png
        path.join(__dirname, '../../frontend/public/logo.png'), // Dev: frontend/public/logo.png
        path.join(__dirname, '../../public/logo.png')          // Alternativo
    ];
    
    let logoPath = null;
    for (const p of possibleLogoPaths) {
        if (fs.existsSync(p)) {
            logoPath = p;
            console.log(`✅ Logo encontrada em: ${p}`);
            break;
        }
    }

    const attachments = [];
    if (logoPath) {
        attachments.push({
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo'
        });
    } else {
        console.warn('⚠️ Logo não encontrada em nenhum caminho esperado');
    }

    // Usar cid:logo se o attachment estiver disponível, senão usar URL externa
    const logoImg = logoPath 
        ? '<img src="cid:logo" alt="Lumini I.A" style="width: 60px; height: 60px; margin-bottom: 10px; display: inline-block; background-color: white; padding: 8px; border-radius: 8px;">'
        : '<img src="https://www.luminiiadigital.com.br/logo.png" alt="Lumini I.A" style="width: 60px; height: 60px; margin-bottom: 10px; display: inline-block; background-color: white; padding: 8px; border-radius: 8px;">';

    const mailOptions = {
        from: fromAddress,
        to: user.email,
        subject: 'Redefinição de Senha - Lumini I.A',
        attachments: attachments.length > 0 ? attachments : undefined,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <div style="background: linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                  ${logoImg}
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
        `
    };

    try {
        console.log('📨 Sending email with nodemailer...');
        console.log('🔧 Transporter options:', JSON.stringify(transporter.options, null, 2));
        console.log('📤 Mail options (from):', mailOptions.from);
        console.log('📤 Mail options (to):', mailOptions.to);
        console.log('📤 Mail options (subject):', mailOptions.subject);
        
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ ===== EMAIL SENT SUCCESSFULLY =====');
        console.log(`📧 Message ID: ${info.messageId}`);
        console.log(`📬 Response: ${info.response}`);
        console.log(`📧 Email sent to: ${user.email}`);
        console.log(`📮 Accepted: ${JSON.stringify(info.accepted)}`);
        console.log(`❌ Rejected: ${JSON.stringify(info.rejected)}`);
        console.log(`📊 Envelope: ${JSON.stringify(info.envelope)}`);
        console.log('===================================\n');
    } catch (error) {
        console.error('❌ ===== EMAIL SEND FAILED =====');
        console.error('Error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error command:', error.command);
        console.error('================================\n');
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

    const logoPath = getLogoPath();
    const attachments = [];
    if (logoPath) {
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
    console.log(`📧 Attempting to send invite email to: ${email}`);
    
    const transporter = await getTransporter();
    if (!transporter) {
        console.error('❌ SMTP not configured! Cannot send invite email.');
        throw new Error('SMTP não configurado. Configure em Admin → Configurações do Sistema.');
    }
    
    const fromAddress = await getFromAddress();
    console.log(`📤 Sending from: ${fromAddress}`);

    const logoPath = getLogoPath();
    const attachments = [];
    if (logoPath) {
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
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Invite email sent successfully to ${email}`);
        console.log(`   Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Error sending invite email:', error);
        console.error('   Error details:', {
            message: error.message,
            code: error.code,
            command: error.command
        });
        throw error; // Re-throw para que o erro seja capturado na rota
    }
};

/**
 * Send Notification to Accountant about New Client Link
 * @param {Object} client - User object (client)
 * @param {String} accountantEmail - Accountant email
 */
const sendNewClientNotification = async (client, accountantEmail) => {
    console.log(`📧 Attempting to send new client notification to: ${accountantEmail}`);
    
    const transporter = await getTransporter();
    if (!transporter) {
        console.error('❌ SMTP not configured! Cannot send new client notification.');
        throw new Error('SMTP não configurado. Configure em Admin → Configurações do Sistema.');
    }
    
    const fromAddress = await getFromAddress();
    console.log(`📤 Sending notification from: ${fromAddress}`);

    const logoPath = getLogoPath();
    const attachments = [];
    if (logoPath) {
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
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ New client notification sent successfully to ${accountantEmail}`);
        console.log(`   Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Error sending new client notification:', error);
        console.error('   Error details:', {
            message: error.message,
            code: error.code,
            command: error.command
        });
        throw error; // Re-throw para que o erro seja capturado na rota
    }
};

/**
 * Get SMTP Status for diagnostics
 */
const getSmtpStatus = async () => {
    try {
        const dbConfigs = await SystemConfig.findAll({
            where: { key: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SECURE', 'SMTP_FROM'] }
        });
        
        const host = dbConfigs.find(c => c.key === 'SMTP_HOST')?.value || process.env.EMAIL_HOST;
        const isConfigured = !!host;
        
        return {
            isConfigured,
            message: isConfigured ? 'SMTP configurado' : 'SMTP não configurado',
            env: {
                EMAIL_HOST: process.env.EMAIL_HOST || 'N/A',
                EMAIL_PORT: process.env.EMAIL_PORT || 'N/A',
                EMAIL_USER: process.env.EMAIL_USER || 'N/A',
                EMAIL_PASS: process.env.EMAIL_PASS ? '********' : 'N/A',
                EMAIL_SECURE: process.env.EMAIL_SECURE || 'N/A',
                EMAIL_FROM: process.env.EMAIL_FROM || 'N/A'
            },
            dbConfigs: dbConfigs.map(c => ({ key: c.key, value: c.key === 'SMTP_PASS' ? '********' : c.value })),
            activeConfig: {
                host: dbConfigs.find(c => c.key === 'SMTP_HOST')?.value || process.env.EMAIL_HOST,
                port: dbConfigs.find(c => c.key === 'SMTP_PORT')?.value || process.env.EMAIL_PORT,
                secure: dbConfigs.find(c => c.key === 'SMTP_SECURE')?.value || process.env.EMAIL_SECURE,
                from: dbConfigs.find(c => c.key === 'SMTP_FROM')?.value || process.env.EMAIL_FROM,
                auth: {
                    user: dbConfigs.find(c => c.key === 'SMTP_USER')?.value || process.env.EMAIL_USER
                }
            }
        };
    } catch (error) {
        return {
            isConfigured: false,
            message: 'Erro ao verificar configuração',
            error: error.message
        };
    }
};

/**
 * Send Client Invite Email (from Accountant to Client)
 * @param {Object} accountant - Accountant object sending the invite
 * @param {String} email - Client email
 * @param {String} inviteToken - Unique token for invitation
 */
const sendClientInviteEmail = async (accountant, email, inviteToken) => {
    console.log(`📧 Attempting to send client invite email to: ${email}`);
    
    const transporter = await getTransporter();
    if (!transporter) {
        console.error('❌ SMTP not configured! Cannot send invite email.');
        throw new Error('SMTP não configurado. Configure em Admin → Configurações do Sistema.');
    }
    
    const fromAddress = await getFromAddress();
    console.log(`📤 Sending from: ${fromAddress}`);

    const logoPath = getLogoPath();
    const attachments = [];
    if (logoPath) {
        attachments.push({
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo'
        });
    }

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?invite=${inviteToken}`;
    
    const mailOptions = {
        from: fromAddress,
        to: email,
        subject: `${accountant.name || 'Seu contador'} te convidou para o Lumini I.A! 🎉`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%); padding: 30px; text-align: center;">
                    ${logoPath ? '<img src="cid:logo" alt="Lumini I.A" style="width: 60px; height: 60px; background-color: white; padding: 8px; border-radius: 8px; margin-bottom: 15px;">' : ''}
                    <h1 style="color: white; margin: 0; font-size: 26px;">Você foi convidado!</h1>
                </div>
                
                <div style="padding: 30px; background-color: white;">
                    <p style="font-size: 16px; color: #4a5568;">Olá,</p>
                    
                    <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">
                        <strong>${accountant.name || accountant.email}</strong>, seu contador, convidou você para se juntar ao <strong>Lumini I.A</strong>!
                    </p>
                    
                    <div style="background: linear-gradient(to right, #eff6ff, #f3f4f6); border-left: 4px solid #6d28d9; padding: 20px; margin: 25px 0; border-radius: 4px;">
                        <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 18px;">🚀 Por que usar o Lumini I.A?</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #475569;">
                            <li style="margin: 8px 0;">✅ Gestão financeira completa e automatizada</li>
                            <li style="margin: 8px 0;">📊 Relatórios e gráficos em tempo real</li>
                            <li style="margin: 8px 0;">🤝 Compartilhe dados com seu contador facilmente</li>
                            <li style="margin: 8px 0;">📄 Organize documentos fiscais em um só lugar</li>
                        </ul>
                    </div>
                    
                    <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">
                        Ao criar sua conta, você será automaticamente conectado ao seu contador, facilitando todo o processo de gestão fiscal e financeira!
                    </p>
                    
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="${inviteLink}" style="background: linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3); display: inline-block;">
                            🎯 Criar Minha Conta Grátis
                        </a>
                    </div>

                    <p style="color: #718096; font-size: 13px; text-align: center; margin-top: 25px;">
                        Este convite é válido por 7 dias.<br>
                        Se o botão não funcionar, copie e cole este link no navegador:<br>
                        <span style="word-break: break-all; color: #6d28d9;">${inviteLink}</span>
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
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Client invite email sent successfully to ${email}`);
        console.log(`   Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Error sending client invite email:', error);
        console.error('   Error details:', {
            message: error.message,
            code: error.code,
            command: error.command
        });
        throw error;
    }
};

/**
 * Send Notification Email (Generic)
 */
const sendNotificationEmail = async (email, title, message) => {
    if (!email) return;

    const transporter = await getTransporter();
    if (!transporter) {
        console.warn('Email not sent: SMTP not configured');
        return;
    }

    const fromAddress = await getFromAddress();
    const logoPath = getLogoPath();
    const attachments = [];
    if (logoPath) {
        attachments.push({
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo'
        });
    }

    const mailOptions = {
        from: fromAddress,
        to: email,
        subject: title,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #6d28d9; padding: 30px; text-align: center;">
                    ${logoPath ? '<img src="cid:logo" alt="Lumini I.A" style="width: 50px; height: auto; margin-bottom: 10px;">' : ''}
                    <h1 style="color: white; margin: 10px 0 0 0; font-size: 24px;">${title}</h1>
                </div>
                
                <div style="padding: 30px; background-color: white;">
                    <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">${message}</p>
                    
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="${process.env.FRONTEND_URL || 'https://www.luminiiadigital.com.br'}" 
                           style="background-color: #6d28d9; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(109, 40, 217, 0.25);">
                            Acessar Lumini I.A
                        </a>
                    </div>
                </div>
                
                <div style="background-color: #f8fafc; padding: 20px; text-center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} Lumini I.A. Todos os direitos reservados.</p>
                </div>
            </div>
        `,
        attachments: attachments
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Notification email sent to ${email}`);
        return info;
    } catch (error) {
        console.error('❌ Error sending notification email:', error);
        throw error;
    }
};

module.exports = {
    sendCancellationEmail,
    sendInvoiceEmail,
    sendWelcomeEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendInviteEmail,
    sendNewClientNotification,
    sendClientInviteEmail,
    sendNotificationEmail,
    getSmtpStatus
};
