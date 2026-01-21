const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const NotificationService = require('../services/NotificationService');

// GET /api/notifications - Listar notificações do usuário
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await NotificationService.getAll(req.user.id, 50);
    const unreadCount = await NotificationService.countUnread(req.user.id);

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Erro ao buscar notificações' });
  }
});

// GET /api/notifications/unread - Listar apenas não lidas
router.get('/unread', auth, async (req, res) => {
  try {
    const notifications = await NotificationService.getUnread(req.user.id);
    
    res.json({
      notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({ message: 'Erro ao buscar notificações não lidas' });
  }
});

// GET /api/notifications/count - Contar não lidas
router.get('/count', auth, async (req, res) => {
  try {
    const count = await NotificationService.countUnread(req.user.id);
    
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error counting notifications:', error);
    res.status(500).json({ message: 'Erro ao contar notificações' });
  }
});

// PUT /api/notifications/:id/read - Marcar como lida
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await NotificationService.markAsRead(
      parseInt(req.params.id),
      req.user.id
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notificação não encontrada' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Erro ao atualizar notificação' });
  }
});

// PUT /api/notifications/mark-all-read - Marcar todas como lidas
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    await NotificationService.markAllAsRead(req.user.id);

    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Erro ao atualizar notificações' });
  }
});

module.exports = router;
