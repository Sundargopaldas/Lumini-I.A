const nodemailer = require('nodemailer');

// Configure Transporter
// For Gmail: use App Password (not your login password)
// For testing: use Ethereal.email or similar
const transporter = nodemailer.createTransport({
    service: 'gmail', // or 'hotmail', 'yahoo', etc.
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send Cancellation Confirmation Email
 * @param {Object} user - User object containing email and name
 * @param {String} reason - Reason for cancellation provided by user
 */
const sendCancellationEmail = async (user, reason) => {
    if (!user.email) return;

    const mailOptions = {
        from: `"Equipe Lumini I.A" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Confirmação de Cancelamento de Assinatura',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
    } catch (error) {
        console.error('Error sending cancellation email:', error);
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
    sendInvoiceEmail
};
