const nodemailer = require('nodemailer');

// Configure Transporter
// Supports both Gmail (simple) and Professional SMTP (Zoho, Outlook, AWS SES, etc.)
const transporterConfig = process.env.EMAIL_HOST 
    ? {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    } 
    : {
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    };

const transporter = nodemailer.createTransport(transporterConfig);

/**
 * Send Cancellation Confirmation Email
 * @param {Object} user - User object containing email and name
 * @param {String} reason - Reason for cancellation provided by user
 */
const sendCancellationEmail = async (user, reason) => {
    console.log(`[EmailService] sendCancellationEmail called for: ${user.email}`);
    if (!user.email) {
        console.error('[EmailService] User has no email defined!');
        return;
    }

    const logoUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Equipe Lumini I.A" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Confirmação de Cancelamento de Assinatura',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${logoUrl}" alt="Lumini I.A" style="width: 50px; height: 50px;">
                </div>
                <h2 style="color: #4a5568;">Cancelamento Recebido</h2>
                <p>Olá, ${user.name || 'Usuário'},</p>
                <p>Recebemos sua solicitação de cancelamento da assinatura <strong>Lumini I.A</strong>.</p>
                <p>Sua assinatura permanecerá ativa até o final do período de cobrança atual. Após essa data, sua conta retornará ao plano Gratuito.</p>
                
                ${reason ? `<p><strong>Motivo informado:</strong> ${reason}</p>` : ''}
                
                <p>Sentimos muito em ver você partir. Se houver algo que possamos fazer para melhorar sua experiência, por favor, responda a este e-mail.</p>
                
                <p>Atenciosamente,<br>Equipe Lumini I.A</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Cancellation email sent to ${user.email}`);
        
        // Also send notification to Admin
        const adminMailOptions = {
            from: `"System Bot" <${process.env.EMAIL_USER}>`,
            to: process.env.SUPPORT_EMAIL || process.env.EMAIL_USER, // Send to support email or admin
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

    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Equipe Lumini I.A" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Bem-vindo(a) ao Lumini I.A Premium! 🚀',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background: #6d28d9; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
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
        `
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

    const logoUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Equipe Lumini I.A" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Redefinição de Senha - Lumini I.A',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <div style="background: linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                  <img src="${logoUrl}" alt="Lumini I.A" style="width: 60px; height: 60px; margin-bottom: 10px; display: inline-block;">
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
                  <p style="font-size: 12px; color: #666;">Se você não solicitou esta alteração, ignore este email.</p>
              </div>
            </div>
        `
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
 * Send Invoice Email (Placeholder for future implementation)
 */
const sendInvoiceEmail = async (toEmail, invoiceData) => {
    // Implementation for invoice email
    console.log(`[Mock] Invoice email sent to ${toEmail}`);
};

module.exports = {
    sendCancellationEmail,
    sendInvoiceEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail
};
