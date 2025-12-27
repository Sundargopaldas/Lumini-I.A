const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "test@ethereal.email", // generated ethereal user
    pass: process.env.SMTP_PASS || "testpass", // generated ethereal password
  },
});

const sendInvoiceEmail = async (to, invoiceData) => {
  try {
    const info = await transporter.sendMail({
      from: '"Lumini I.A" <no-reply@lumini.ia>', // sender address
      to: to, // list of receivers
      subject: `Nota Fiscal de Serviço - ${invoiceData.serviceDescription}`, // Subject line
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Olá, ${invoiceData.clientName}</h2>
          <p>Sua Nota Fiscal de Serviço Eletrônica (NFS-e) foi gerada com sucesso.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Serviço:</strong> ${invoiceData.serviceDescription}</p>
            <p><strong>Valor:</strong> R$ ${parseFloat(invoiceData.amount).toFixed(2).replace('.', ',')}</p>
            <p><strong>Data de Emissão:</strong> ${new Date(invoiceData.issueDate).toLocaleDateString('pt-BR')}</p>
            <p><strong>Número da Nota:</strong> ${invoiceData.id.toString().padStart(6, '0')}</p>
          </div>

          <p>Você pode visualizar ou baixar sua nota fiscal acessando o painel.</p>
          
          <p>Atenciosamente,<br>Equipe Lumini I.A</p>
        </div>
      `, // html body
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw error to avoid blocking the main flow, just log it
    return null;
  }
};

const sendCancellationEmail = async (user, reason) => {
  try {
    // Send to admin/company
    await transporter.sendMail({
      from: '"Lumini I.A System" <no-reply@lumini.ia>',
      to: 'contato@lumini.ia', // The company email to receive feedback
      subject: `Cancelamento de Assinatura - ${user.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Relatório de Cancelamento</h2>
          <p>Um usuário cancelou a assinatura Premium/Pro.</p>
          
          <div style="background-color: #fff0f0; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffcccc;">
            <p><strong>Usuário:</strong> ${user.name} (${user.email})</p>
            <p><strong>Plano Cancelado:</strong> ${user.plan}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <hr style="border: 0; border-top: 1px solid #ffcccc; margin: 10px 0;">
            <p><strong>Motivo do Cancelamento:</strong></p>
            <p style="font-style: italic; color: #555;">"${reason}"</p>
          </div>
        </div>
      `,
    });
    console.log(`Cancellation email sent for user ${user.email}`);
  } catch (error) {
    console.error("Error sending cancellation email:", error);
  }
};

module.exports = {
  sendInvoiceEmail,
  sendCancellationEmail
};
