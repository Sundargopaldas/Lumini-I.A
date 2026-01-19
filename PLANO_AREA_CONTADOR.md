# 🎯 PLANO COMPLETO - Área Exclusiva do Contador

**Status:** 📋 Planejamento Completo | Pronto para Implementação

---

## ✅ **O QUE JÁ EXISTE (Funcional)**

### Backend:
- ✅ Modelo `Accountant` completo
- ✅ Modelo `User` com campo `accountantId` (link contador ↔ cliente)
- ✅ Rotas `/api/accountants/me/clients` - Lista clientes
- ✅ Rotas `/api/accountants/client/:id/report` - Relatório por cliente
- ✅ Sistema de convite por email
- ✅ Vínculo/desvínculo de clientes

### Frontend:
- ✅ Página `AccountantDashboard.jsx` básica
- ✅ Lista de clientes
- ✅ Seleção de cliente individual
- ✅ Visualização de relatório por cliente

---

## 🆕 **O QUE PRECISA SER IMPLEMENTADO**

### 1️⃣ **Dashboard Agregado do Contador** (PRIORITÁRIO)

#### Backend - Nova Rota:
```javascript
// backend/routes/accountants.js

// GET /api/accountants/dashboard/stats - Estatísticas agregadas de todos os clientes
router.get('/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar se é contador
    const accountantProfile = await Accountant.findOne({ where: { userId } });
    if (!accountantProfile) {
      return res.status(403).json({ message: 'Perfil de contador não encontrado.' });
    }

    // Buscar todos os clientes
    const clients = await User.findAll({
      where: { accountantId: accountantProfile.id },
      attributes: ['id', 'name', 'email', 'plan', 'createdAt']
    });

    const clientIds = clients.map(c => c.id);

    // Buscar todas as transações dos clientes (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await Transaction.findAll({
      where: {
        userId: { [Op.in]: clientIds },
        date: { [Op.gte]: thirtyDaysAgo }
      }
    });

    // Buscar notas fiscais pendentes
    const Invoice = require('../models/Invoice');
    const pendingInvoices = await Invoice.findAll({
      where: {
        userId: { [Op.in]: clientIds },
        status: 'processing'
      }
    });

    // Calcular estatísticas
    const totalRevenue = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + parseFloat(t.amount), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + parseFloat(t.amount), 0);

    // Clientes por plano
    const clientsByPlan = clients.reduce((acc, c) => {
      acc[c.plan] = (acc[c.plan] || 0) + 1;
      return acc;
    }, {});

    // Atividade recente (transações por dia)
    const last7Days = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      last7Days[dateKey] = { income: 0, expense: 0, count: 0 };
    }

    transactions.forEach(t => {
      const dateKey = t.date.substring(0, 10);
      if (last7Days[dateKey]) {
        const amount = parseFloat(t.amount);
        if (t.type === 'income') {
          last7Days[dateKey].income += amount;
        } else {
          last7Days[dateKey].expense += amount;
        }
        last7Days[dateKey].count += 1;
      }
    });

    // Alertas/Pendências
    const alerts = [
      ...pendingInvoices.map(inv => ({
        type: 'invoice_pending',
        message: `Nota fiscal #${inv.id} aguardando processamento`,
        clientId: inv.userId,
        priority: 'medium',
        date: inv.createdAt
      }))
      // Adicionar mais alertas conforme necessário
    ];

    res.json({
      overview: {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.plan !== 'free').length,
        totalRevenue: totalRevenue.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        netIncome: (totalRevenue - totalExpenses).toFixed(2)
      },
      clientsByPlan,
      recentActivity: last7Days,
      alerts,
      topClients: clients.slice(0, 5) // Top 5 clientes mais recentes
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Erro ao carregar estatísticas' });
  }
});
```

#### Frontend - Melhorar Dashboard:
```jsx
// frontend/src/pages/AccountantDashboard.jsx

import { Line, Bar, Doughnut } from 'react-chartjs-2';

const AccountantDashboard = () => {
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Buscar estatísticas agregadas
        const statsRes = await api.get('/accountants/dashboard/stats');
        setStats(statsRes.data);
        setAlerts(statsRes.data.alerts || []);

        // Buscar lista de clientes
        const clientsRes = await api.get('/accountants/me/clients');
        setClients(clientsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total de Clientes"
          value={stats?.overview.totalClients || 0}
          icon="👥"
          color="blue"
        />
        <MetricCard 
          title="Receita Total (30d)"
          value={`R$ ${stats?.overview.totalRevenue || '0,00'}`}
          icon="💰"
          color="green"
        />
        <MetricCard 
          title="Alertas Pendentes"
          value={alerts.length}
          icon="⚠️"
          color="yellow"
        />
        <MetricCard 
          title="Clientes Ativos"
          value={stats?.overview.activeClients || 0}
          icon="✅"
          color="purple"
        />
      </div>

      {/* Gráfico de Atividade */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Atividade dos Últimos 7 Dias</h3>
        <Line data={prepareActivityChart(stats?.recentActivity)} />
      </div>

      {/* Alertas */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          ⚠️ Alertas e Pendências
          {alerts.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {alerts.length}
            </span>
          )}
        </h3>
        
        {alerts.length === 0 ? (
          <p className="text-gray-500">✅ Nenhum alerta no momento!</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="text-2xl">{alert.type === 'invoice_pending' ? '📝' : '⚠️'}</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{alert.message}</p>
                  <p className="text-xs text-gray-500">{new Date(alert.date).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Seus Clientes</h3>
        <ClientsTable clients={clients} />
      </div>
    </div>
  );
};
```

---

### 2️⃣ **Sistema de Notificações por E-mail** (MÉDIO)

#### Backend - Modelo de Notificação:
```javascript
// backend/models/Notification.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'invoice_pending',
      'invoice_issued',
      'payment_due',
      'new_transaction',
      'client_added',
      'tax_deadline'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
});

module.exports = Notification;
```

#### Backend - Serviço de Notificações:
```javascript
// backend/services/NotificationService.js

const Notification = require('../models/Notification');
const EmailService = require('./EmailService');
const User = require('../models/User');

class NotificationService {
  
  // Criar notificação e enviar email
  static async create(userId, type, title, message, metadata = {}) {
    try {
      // Criar notificação no banco
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        metadata
      });

      // Buscar usuário para enviar email
      const user = await User.findByPk(userId);
      
      if (user && user.email) {
        try {
          await EmailService.sendNotification(user.email, title, message);
          notification.emailSent = true;
          await notification.save();
        } catch (emailError) {
          console.error('Erro ao enviar email de notificação:', emailError);
        }
      }

      return notification;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  // Notificar contador sobre novo cliente
  static async notifyNewClient(accountantUserId, clientName) {
    return this.create(
      accountantUserId,
      'client_added',
      'Novo Cliente Adicionado',
      `${clientName} foi vinculado à sua contabilidade.`,
      { clientName }
    );
  }

  // Notificar sobre nota fiscal pendente
  static async notifyInvoicePending(accountantUserId, invoiceId, clientName) {
    return this.create(
      accountantUserId,
      'invoice_pending',
      'Nota Fiscal Pendente',
      `Nota fiscal #${invoiceId} de ${clientName} está aguardando processamento.`,
      { invoiceId, clientName }
    );
  }

  // Buscar notificações não lidas
  static async getUnread(userId) {
    return Notification.findAll({
      where: { userId, read: false },
      order: [['createdAt', 'DESC']]
    });
  }

  // Marcar como lida
  static async markAsRead(notificationId) {
    const notification = await Notification.findByPk(notificationId);
    if (notification) {
      notification.read = true;
      await notification.save();
    }
    return notification;
  }
}

module.exports = NotificationService;
```

#### Backend - Rotas de Notificações:
```javascript
// backend/routes/notifications.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// GET /api/notifications - Listar notificações do usuário
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Erro ao buscar notificações' });
  }
});

// PUT /api/notifications/:id/read - Marcar como lida
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notificação não encontrada' });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Erro ao atualizar notificação' });
  }
});

// PUT /api/notifications/mark-all-read - Marcar todas como lidas
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    await Notification.update(
      { read: true },
      { where: { userId: req.user.id, read: false } }
    );

    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Erro ao atualizar notificações' });
  }
});

module.exports = router;
```

#### Frontend - Componente de Notificações:
```jsx
// frontend/src/components/NotificationBell.jsx

import { useState, useEffect } from 'react';
import api from '../services/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Polling a cada 60 segundos
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-bold">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-purple-600 hover:text-purple-700"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p className="text-3xl mb-2">🔔</p>
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    !notif.read ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {notif.type === 'invoice_pending' && '📝'}
                      {notif.type === 'client_added' && '👤'}
                      {notif.type === 'payment_due' && '💰'}
                      {notif.type === 'tax_deadline' && '⚠️'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notif.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
```

---

### 3️⃣ **Central de Ajuda / FAQ** (BAIXO)

#### Frontend - Página de Ajuda:
```jsx
// frontend/src/pages/Help.jsx

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Help = () => {
  const [openCategory, setOpenCategory] = useState(null);
  const [openQuestion, setOpenQuestion] = useState(null);

  const categories = [
    {
      id: 'getting-started',
      title: '🚀 Primeiros Passos',
      icon: '🚀',
      questions: [
        {
          q: 'Como criar minha conta?',
          a: 'Clique em "Criar Conta" no menu superior. Preencha seus dados e confirme seu email. Em poucos minutos você estará pronto para usar o Lumini!'
        },
        {
          q: 'Como vincular meu contador?',
          a: 'Vá em "Configurações" → "Meu Contador" → Digite o email do seu contador → "Enviar Convite". Ele receberá um email e poderá aceitar o vínculo.'
        },
        {
          q: 'Quais planos estão disponíveis?',
          a: 'Temos 3 planos: FREE (para testar), PRO (R$ 49/mês - ideal para MEIs), PREMIUM (R$ 99/mês - para empresas maiores). Veja detalhes em "Planos".'
        }
      ]
    },
    {
      id: 'invoices',
      title: '📝 Notas Fiscais',
      icon: '📝',
      questions: [
        {
          q: 'Como emitir minha primeira nota fiscal?',
          a: 'Vá em "Notas Fiscais" → "Emitir Nova Nota" → Preencha os dados do cliente e serviço → "Emitir". O sistema calculará os tributos automaticamente!'
        },
        {
          q: 'Preciso de certificado digital?',
          a: 'Sim! Para emitir NFS-e real, você precisa de um Certificado Digital A1. Você pode comprá-lo em certificadoras como Serasa, Certisign, etc.'
        },
        {
          q: 'Como funciona o cálculo de tributos?',
          a: 'O Lumini calcula automaticamente ISS, IR, PIS, COFINS e CSLL baseado no valor do serviço. As alíquotas padrão são aplicadas, mas você pode ajustar conforme seu regime tributário.'
        }
      ]
    },
    {
      id: 'integrations',
      title: '🔌 Integrações',
      icon: '🔌',
      questions: [
        {
          q: 'Como conectar minha conta Hotmart?',
          a: 'Vá em "Integrações" → "Hotmart" → "Conectar" → Será redirecionado para autorizar → Após autorizar, clique em "Sincronizar Agora" para importar suas vendas!'
        },
        {
          q: 'Como conectar meu banco (Open Finance)?',
          a: 'Vá em "Integrações" → "Open Finance" → "Conectar" → Escolha seu banco → Faça login → Autorize. Suas transações serão importadas automaticamente!'
        },
        {
          q: 'É seguro conectar meu banco?',
          a: 'SIM! Usamos Open Finance (padrão oficial do Banco Central). NUNCA pedimos sua senha bancária. A conexão é criptografada e regulamentada pelo BC.'
        }
      ]
    },
    {
      id: 'accountant',
      title: '👨‍💼 Área do Contador',
      icon: '👨‍💼',
      questions: [
        {
          q: 'Como criar meu perfil de contador?',
          a: 'Vá em "Marketplace" → "Tornar-me Contador" → Preencha seus dados (CRC, especialidade, etc) → Enviar. Seu perfil será aprovado em até 24h.'
        },
        {
          q: 'Como adicionar clientes?',
          a: 'Seus clientes devem vincular você pelo email. Ou você pode convidá-los em "Dashboard do Contador" → "Convidar Cliente".'
        },
        {
          q: 'Como visualizar dados dos meus clientes?',
          a: 'Acesse "Dashboard do Contador" → Selecione o cliente → Veja receitas, despesas, notas fiscais e relatórios completos.'
        }
      ]
    },
    {
      id: 'billing',
      title: '💳 Pagamentos e Planos',
      icon: '💳',
      questions: [
        {
          q: 'Como fazer upgrade para PRO?',
          a: 'Vá em "Planos" → Escolha PRO ou PREMIUM → "Assinar" → Preencha dados do cartão → Pronto! O upgrade é imediato.'
        },
        {
          q: 'Posso cancelar a qualquer momento?',
          a: 'Sim! Sem fidelidade. Você pode cancelar em "Configurações" → "Assinatura" → "Cancelar Plano". Terá acesso até o fim do período pago.'
        },
        {
          q: 'Quais formas de pagamento aceitam?',
          a: 'Cartão de crédito (via Stripe) e PIX (em breve). Boleto bancário disponível em alguns planos.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">🆘 Central de Ajuda</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Encontre respostas para suas dúvidas ou entre em contato conosco
          </p>
        </div>

        {/* Search (placeholder) */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="🔍 Buscar dúvidas..."
            className="w-full px-4 py-3 rounded-lg border dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {categories.map(category => (
            <div key={category.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{category.icon}</span>
                  <h3 className="text-lg font-bold">{category.title}</h3>
                </div>
                <svg
                  className={`w-5 h-5 transition-transform ${
                    openCategory === category.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {openCategory === category.id && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 space-y-3">
                      {category.questions.map((item, idx) => (
                        <div key={idx} className="border-l-2 border-purple-500 pl-4">
                          <button
                            onClick={() => setOpenQuestion(openQuestion === `${category.id}-${idx}` ? null : `${category.id}-${idx}`)}
                            className="text-left font-medium hover:text-purple-600 transition-colors"
                          >
                            {item.q}
                          </button>
                          
                          <AnimatePresence>
                            {openQuestion === `${category.id}-${idx}` && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 text-sm text-gray-600 dark:text-gray-400"
                              >
                                {item.a}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Ainda precisa de ajuda?</h3>
          <p className="mb-4">Nossa equipe está pronta para te atender!</p>
          <div className="flex justify-center gap-4">
            <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors">
              📧 Enviar Email
            </button>
            <button className="bg-white/20 px-6 py-2 rounded-lg font-bold hover:bg-white/30 transition-colors">
              💬 Chat ao Vivo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
```

---

## 🚀 **ORDEM DE IMPLEMENTAÇÃO SUGERIDA**

### Semana 1:
1. ✅ Implementar rota `/api/accountants/dashboard/stats` (Backend)
2. ✅ Melhorar `AccountantDashboard.jsx` com gráficos e alertas
3. ✅ Testar com contadores

### Semana 2:
1. ✅ Criar modelo e rotas de Notificações
2. ✅ Implementar `NotificationBell` component
3. ✅ Integrar notificações no fluxo (novo cliente, NFS-e pendente, etc)

### Semana 3:
1. ✅ Criar página de Central de Ajuda
2. ✅ Adicionar vídeos tutoriais (YouTube embeds)
3. ✅ Sistema de busca no FAQ

---

## 📊 **MÉTRICAS DE SUCESSO**

### Para Contadores:
- ✅ Visualizar todos os clientes em um dashboard
- ✅ Ver estatísticas agregadas (receita total, despesas, etc)
- ✅ Receber alertas de pendências por email
- ✅ Acessar relatórios individuais de cada cliente
- ✅ Ter acesso à central de ajuda completa

### Para Clientes:
- ✅ Receber notificações de ações importantes
- ✅ Ter suporte via FAQ
- ✅ Não ver dados de outros clientes do contador

---

## 🎯 **PRÓXIMOS PASSOS IMEDIATOS**

1. Revisar este plano
2. Decidir prioridades
3. Implementar backend primeiro (rotas + serviços)
4. Implementar frontend (componentes)
5. Testar com contadores reais
6. Coletar feedback e iterar

---

**Status:** 📋 Planejamento Completo  
**Tempo Estimado:** 2-3 semanas  
**Complexidade:** Média-Alta  
**Prioridade:** Alta (para contadores)

**Última atualização:** 19/01/2026
