const Notification = require('../models/Notification');
const EmailService = require('./EmailService');
const User = require('../models/User');

class NotificationService {
  
  /**
   * Criar notificação e opcionalmente enviar email
   * @param {number} userId - ID do usuário
   * @param {string} type - Tipo da notificação
   * @param {string} title - Título
   * @param {string} message - Mensagem
   * @param {object} metadata - Dados adicionais
   * @param {boolean} sendEmail - Se deve enviar email (padrão: true)
   */
  static async create(userId, type, title, message, metadata = {}, sendEmail = true) {
    try {
      // Criar notificação no banco
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        metadata
      });

      // Enviar email se solicitado
      if (sendEmail) {
        const user = await User.findByPk(userId);
        
        if (user && user.email) {
          try {
            await EmailService.sendNotificationEmail(user.email, title, message);
            notification.emailSent = true;
            await notification.save();
            console.log(`✅ [Notification] Email enviado para ${user.email}`);
          } catch (emailError) {
            console.error('⚠️ [Notification] Erro ao enviar email:', emailError.message);
            // Não falha a criação da notificação se email falhar
          }
        }
      }

      return notification;
    } catch (error) {
      console.error('❌ [Notification] Erro ao criar notificação:', error);
      throw error;
    }
  }

  /**
   * Notificar contador sobre novo cliente
   */
  static async notifyNewClient(accountantUserId, clientName, clientEmail) {
    return this.create(
      accountantUserId,
      'client_added',
      '👤 Novo Cliente Adicionado',
      `${clientName} (${clientEmail}) foi vinculado à sua contabilidade.`,
      { clientName, clientEmail }
    );
  }

  /**
   * Notificar sobre nota fiscal pendente
   */
  static async notifyInvoicePending(accountantUserId, invoiceId, clientName) {
    return this.create(
      accountantUserId,
      'invoice_pending',
      '📝 Nota Fiscal Pendente',
      `Nota fiscal #${invoiceId} de ${clientName} está aguardando processamento.`,
      { invoiceId, clientName }
    );
  }

  /**
   * Notificar sobre nota fiscal emitida
   */
  static async notifyInvoiceIssued(userId, invoiceNumber, amount) {
    return this.create(
      userId,
      'invoice_issued',
      '✅ Nota Fiscal Emitida',
      `Sua nota fiscal #${invoiceNumber} no valor de R$ ${amount} foi emitida com sucesso!`,
      { invoiceNumber, amount }
    );
  }

  /**
   * Notificar sobre integração conectada
   */
  static async notifyIntegrationConnected(userId, providerName) {
    return this.create(
      userId,
      'integration_connected',
      '🔌 Integração Conectada',
      `Sua conta ${providerName} foi conectada com sucesso!`,
      { providerName },
      false // Não enviar email para isso
    );
  }

  /**
   * Notificar sobre erro em integração
   */
  static async notifyIntegrationError(userId, providerName, errorMessage) {
    return this.create(
      userId,
      'integration_error',
      '⚠️ Erro na Integração',
      `Detectamos um problema com sua integração ${providerName}: ${errorMessage}`,
      { providerName, errorMessage }
    );
  }

  /**
   * Buscar notificações não lidas
   */
  static async getUnread(userId) {
    return Notification.findAll({
      where: { userId, read: false },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Buscar todas as notificações (com limite)
   */
  static async getAll(userId, limit = 50) {
    return Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  /**
   * Marcar como lida
   */
  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });
    
    if (notification) {
      notification.read = true;
      await notification.save();
    }
    
    return notification;
  }

  /**
   * Marcar todas como lidas
   */
  static async markAllAsRead(userId) {
    await Notification.update(
      { read: true },
      { where: { userId, read: false } }
    );
  }

  /**
   * Contar não lidas
   */
  static async countUnread(userId) {
    return Notification.count({
      where: { userId, read: false }
    });
  }
}

module.exports = NotificationService;
