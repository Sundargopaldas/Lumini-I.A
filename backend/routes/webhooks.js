const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe Webhook Handler
// This ensures that plan updates happen even if the user closes the browser
router.post('/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // In production, verify the webhook signature
    // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    // event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    
    // For development/test without signature verification (be careful!)
    event = req.body;
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
    case 'invoice.payment_succeeded':
      const session = event.data.object;
      // Find user by email and update plan
      if (session.customer_email || session.email) {
        const email = session.customer_email || session.email;
        console.log(`[Stripe Webhook] Payment succeeded for ${email}`);
        
        // Determine plan based on amount or product ID
        // This is a simplified logic. In prod, map price IDs to plans.
        let newPlan = 'pro'; 
        if (session.amount_paid > 5000) newPlan = 'premium'; // Example threshold

        await User.update({ plan: newPlan }, { where: { email } });
      }
      break;
      
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      // Revert to free plan if subscription is cancelled
      // We need to fetch customer email from Stripe if not present in the event object
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.send();
});

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