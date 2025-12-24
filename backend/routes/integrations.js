const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Sync/Import transactions from a provider (Mock)
router.post('/sync', auth, async (req, res) => {
  const { provider } = req.body;

  try {
    // Check if user is Pro or higher
    const user = await User.findByPk(req.user.id);
    if (user.plan === 'free') {
      return res.status(403).json({ 
        message: 'Auto-sync is a Pro feature. Please upgrade.' 
      });
    }

    // Mock Data based on provider
    let newTransactions = [];
    const today = new Date().toISOString().split('T')[0];

    if (provider === 'Nubank') {
      newTransactions = [
        {
          description: 'Uber *Trip',
          amount: -24.90,
          type: 'expense',
          source: 'Transport',
          date: today
        },
        {
          description: 'Spotify Premium',
          amount: -21.90,
          type: 'expense',
          source: 'Subscriptions',
          date: today
        },
        {
          description: 'Starbucks Coffee',
          amount: -18.50,
          type: 'expense',
          source: 'Food',
          date: today
        }
      ];
    } else if (provider === 'Hotmart') {
      newTransactions = [
        {
          description: 'Course Sales #1234',
          amount: 149.90,
          type: 'income',
          source: 'Hotmart',
          date: today
        },
        {
          description: 'Course Sales #1235',
          amount: 297.00,
          type: 'income',
          source: 'Hotmart',
          date: today
        }
      ];
    } else if (provider === 'YouTube') {
      newTransactions = [
        {
          description: 'AdSense Earnings',
          amount: 450.00,
          type: 'income',
          source: 'YouTube',
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
