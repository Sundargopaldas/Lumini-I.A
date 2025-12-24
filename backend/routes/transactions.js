const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Get all transactions for the user
router.get('/', auth, async (req, res) => {
  try {
    console.log(`[GET /transactions] Request from User ID: ${req.user.id}`);
    
    // Debug: Check if user has transactions
    const count = await Transaction.count({ where: { userId: req.user.id } });
    console.log(`[GET /transactions] Found ${count} transactions in DB for User ${req.user.id}`);

    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']],
    });
    
    console.log(`[GET /transactions] Returning ${transactions.length} transactions`);
    res.json(transactions);
  } catch (err) {
    console.error('[GET /transactions] Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create transaction
router.post('/', auth, async (req, res) => {
  const { amount, description, date, type, source } = req.body;

  try {
    // Check plan limits
    const user = await User.findByPk(req.user.id);
    
    if (user.plan === 'free' && type === 'income') {
      const transactions = await Transaction.findAll({
        where: { 
          userId: req.user.id, 
          type: 'income' 
        },
        attributes: ['source']
      });
      
      const distinctSources = [...new Set(transactions.map(t => t.source))];
      
      if (distinctSources.length >= 2 && !distinctSources.includes(source)) {
        return res.status(403).json({ 
          message: 'Free plan limited to 2 income sources. Upgrade to Pro for unlimited sources.' 
        });
      }
    }

    const newTransaction = await Transaction.create({
      amount,
      description,
      date,
      type,
      source,
      userId: req.user.id
    });

    res.json(newTransaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update transaction
router.put('/:id', auth, async (req, res) => {
  const { amount, description, date, type, source } = req.body;

  try {
    let transaction = await Transaction.findByPk(req.params.id);

    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }

    // Make sure user owns transaction
    if (transaction.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    transaction = await transaction.update({
      amount,
      description,
      date,
      type,
      source
    });

    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);

    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }

    // Make sure user owns transaction
    if (transaction.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await transaction.destroy();

    res.json({ msg: 'Transaction removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
