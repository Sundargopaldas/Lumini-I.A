const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Integration = require('../models/Integration');
const BankingService = require('../services/BankingService');
const YouTubeService = require('../services/YouTubeService');
const PluggyService = require('../services/PluggyService');
const StripeService = require('../services/StripeService');
const AsaasService = require('../services/AsaasService');

// Get all connected integrations
router.get('/', auth, async (req, res) => {
  try {
    const integrations = await Integration.findAll({
      where: { userId: req.user.id }
    });
    res.json(integrations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Connect a new integration
router.post('/connect', auth, async (req, res) => {
  const { provider, apiKey } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    const currentIntegrations = await Integration.count({ where: { userId: req.user.id } });

    // Limit Logic: Free users max 0 integrations (Paid feature only)
    if (user.plan === 'free') {
      return res.status(403).json({ 
        message: 'Integrations are a PRO feature. Upgrade to connect your accounts.' 
      });
    }

    // Check if already connected
    const existing = await Integration.findOne({
      where: { userId: req.user.id, provider }
    });

    if (existing) {
      return res.status(400).json({ message: 'Integration already connected' });
    }

    // Create connection
    const newIntegration = await Integration.create({
      userId: req.user.id,
      provider,
      apiKey: apiKey || null,
      status: 'active'
    });

    res.json(newIntegration);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Disconnect
router.delete('/:id', auth, async (req, res) => {
  try {
    const integration = await Integration.findByPk(req.params.id);

    if (!integration) {
      return res.status(404).json({ msg: 'Integration not found' });
    }

    if (integration.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await integration.destroy();
    res.json({ msg: 'Disconnected successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Sync/Import transactions from a provider
router.post('/sync', auth, async (req, res) => {
  const { provider } = req.body;

  try {
    // Check if connected
    const integration = await Integration.findOne({
      where: { userId: req.user.id, provider }
    });

    if (!integration) {
      return res.status(400).json({ message: 'Provider not connected' });
    }

    let newTransactions = [];
    
    // Service Layer Integration
    if (provider === 'Nubank') {
        const bankData = await BankingService.fetchTransactions('Nubank');
        newTransactions = bankData.map(t => ({
            description: t.description,
            amount: t.amount,
            type: t.type,
            source: t.category, 
            date: t.date
        }));
    } else if (provider === 'Open Finance' || provider === 'Pluggy') {
        const pluggyData = await PluggyService.fetchTransactions();
        newTransactions = pluggyData;
    } else if (provider === 'Stripe') {
        const stripeData = await StripeService.fetchRecentPayments(integration.apiKey);
        newTransactions = stripeData;
    } else if (provider === 'Asaas') {
        const asaasData = await AsaasService.fetchReceivables();
        newTransactions = asaasData;
    } else if (provider === 'YouTube') {
        const ytData = await YouTubeService.getChannelRevenue('CHANNEL_ID_MOCK');
        newTransactions = ytData.transactions;
    } else if (provider === 'Hotmart') {
      const today = new Date().toISOString().split('T')[0];
      newTransactions = [
        {
          description: 'Course Sales (Manual Sync)',
          amount: 150.00,
          type: 'income',
          source: 'Hotmart',
          date: today
        }
      ];
    }

    // Insert into DB
    const createdTransactions = await Promise.all(newTransactions.map(t => {
      return Transaction.create({
        ...t,
        userId: req.user.id
      });
    }));

    res.json({ 
      message: `Successfully synced ${createdTransactions.length} transactions from ${provider}`,
      transactions: createdTransactions 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
