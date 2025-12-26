const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Webhook Receiver for Hotmart (Simulation)
// In a real scenario, Hotmart sends a POST request here when a sale occurs.
router.post('/hotmart', async (req, res) => {
  try {
    const { prod_name, price, email, status } = req.body;
    
    // 1. Identify User (In real life, we'd map the email or use an API Key in headers)
    // For simulation, we'll try to find a user by email, or default to the first user if not found
    let user = await User.findOne({ where: { email } });
    
    // Fallback for demo: if no user matches, assign to the first PRO user found
    if (!user) {
        user = await User.findOne({ where: { plan: 'pro' } });
    }

    if (!user) {
        return res.status(404).json({ message: 'User not found for this webhook' });
    }

    // 2. Process only approved sales
    if (status === 'approved') {
        await Transaction.create({
            description: `Hotmart Sale: ${prod_name}`,
            amount: price,
            type: 'income',
            source: 'Hotmart',
            date: new Date(),
            userId: user.id
        });
        
        console.log(`[Webhook] Processed sale for ${user.email}: ${prod_name} - R$ ${price}`);
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;