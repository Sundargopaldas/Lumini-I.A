const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Goal = require('../models/Goal');

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
      include: [{
        model: Goal,
        attributes: ['name', 'color']
      }]
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
  const { amount, description, date, type, source, goalId, isRecurring } = req.body;

  try {
    // Check plan limits
    const user = await User.findByPk(req.user.id);
    
    // Check Recurring Feature (Pro Only)
    if (isRecurring && user.plan === 'free') {
        return res.status(403).json({ message: 'Recurring transactions are a PRO feature.' });
    }

    // Auto-Categorization Logic
    let finalSource = source;

    // Advanced Auto-Categorization (Pro Feature)
    if (['pro', 'premium', 'agency'].includes(user.plan)) {
        if (!source || source === 'Other' || source === '') {
            const desc = description.toLowerCase();
            
            if (type === 'expense') {
                if (desc.match(/ifood|uber eats|mcdonald|burger|pizza|restaurant|coffee|starbucks|outback/)) finalSource = 'Food';
                else if (desc.match(/uber|99|taxi|gas|fuel|parking|metro|bus|shell|ipiranga/)) finalSource = 'Transport';
                else if (desc.match(/amazon|mercado livre|shopee|store|mall|zara|nike/)) finalSource = 'Shopping';
                else if (desc.match(/netflix|spotify|prime|disney|hbo|adobe|chatgpt|youtube/)) finalSource = 'Subscriptions';
                else if (desc.match(/pharmacy|doctor|hospital|gym|smartfit|drugstore/)) finalSource = 'Health';
                else if (desc.match(/hotel|airbnb|flight|airline|booking/)) finalSource = 'Travel';
                else finalSource = 'Other';
            } else if (type === 'income') {
                if (desc.match(/salary|wage|payroll/)) finalSource = 'Salary';
                else if (desc.match(/client|freelance|project|upwork|fiverr/)) finalSource = 'Client';
                else if (desc.match(/hotmart|eduzz|monetizze|kiwify/)) finalSource = 'Hotmart';
                else if (desc.match(/adsense|youtube|google/)) finalSource = 'YouTube';
                else finalSource = 'Other';
            }
        }
    } 
    // Basic Auto-Categorization (Fallback)
    else if ((!source || source === 'Other') && description) {
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('uber') || lowerDesc.includes('99') || lowerDesc.includes('taxi') || lowerDesc.includes('fuel') || lowerDesc.includes('gas')) {
            finalSource = 'Transport';
        } else if (lowerDesc.includes('food') || lowerDesc.includes('market') || lowerDesc.includes('ifood') || lowerDesc.includes('restaurant')) {
            finalSource = 'Food';
        } else if (lowerDesc.includes('netflix') || lowerDesc.includes('spotify') || lowerDesc.includes('prime') || lowerDesc.includes('hbo')) {
            finalSource = 'Entertainment';
        } else if (lowerDesc.includes('upwork') || lowerDesc.includes('fiverr') || lowerDesc.includes('freelance')) {
            finalSource = 'Freelance';
        } else if (lowerDesc.includes('course') || lowerDesc.includes('udemy') || lowerDesc.includes('book')) {
            finalSource = 'Education';
        }
    }

    const newTransaction = await Transaction.create({
      amount,
      description,
      date,
      type,
      source: finalSource,
      goalId: goalId || null,
      isRecurring: isRecurring || false,
      userId: req.user.id
    });

    // If linked to a goal, update goal progress
    if (goalId) {
      const goal = await Goal.findByPk(goalId);
      if (goal && goal.userId === req.user.id) {
        // If type is expense (money spent/saved towards goal), add to currentAmount
        // If type is income (money taken out of goal?), subtract? 
        // Let's assume positive contribution for now regardless of type, or logic:
        // Usually you "expense" from wallet to "income" to goal.
        // We will just ADD the amount to currentAmount.
        await goal.increment('currentAmount', { by: parseFloat(amount) });
      }
    }

    res.json(newTransaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update transaction
router.put('/:id', auth, async (req, res) => {
  const { amount, description, date, type, source, goalId, isRecurring } = req.body;

  try {
    let transaction = await Transaction.findByPk(req.params.id);

    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }

    // Make sure user owns transaction
    if (transaction.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Check Recurring Feature (Pro Only) on Update
    const user = await User.findByPk(req.user.id);
    if (isRecurring === true && user.plan === 'free') {
        return res.status(403).json({ message: 'Recurring transactions are a PRO feature.' });
    }

    const oldGoalId = transaction.goalId;
    const oldAmount = parseFloat(transaction.amount);
    const newAmount = parseFloat(amount);
    const newGoalId = goalId || null;

    // Handle Goal Progress Updates
    if (oldGoalId !== newGoalId) {
        // 1. Remove from old goal if it existed
        if (oldGoalId) {
            const oldGoal = await Goal.findByPk(oldGoalId);
            if (oldGoal) {
                await oldGoal.decrement('currentAmount', { by: oldAmount });
            }
        }
        // 2. Add to new goal if it exists
        if (newGoalId) {
            const newGoal = await Goal.findByPk(newGoalId);
            if (newGoal) {
                await newGoal.increment('currentAmount', { by: newAmount });
            }
        }
    } else if (oldGoalId && oldGoalId === newGoalId) {
        // Same goal, but maybe amount changed
        const difference = newAmount - oldAmount;
        if (difference !== 0) {
            const goal = await Goal.findByPk(oldGoalId);
            if (goal) {
                await goal.increment('currentAmount', { by: difference });
            }
        }
    }

    transaction = await transaction.update({
      amount,
      description,
      date,
      type,
      source,
      isRecurring: isRecurring !== undefined ? isRecurring : transaction.isRecurring,
      goalId: newGoalId
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

    // If linked to a goal, remove amount from goal progress
    if (transaction.goalId) {
        const goal = await Goal.findByPk(transaction.goalId);
        if (goal) {
            await goal.decrement('currentAmount', { by: parseFloat(transaction.amount) });
        }
    }

    await transaction.destroy();

    res.json({ msg: 'Transaction removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
