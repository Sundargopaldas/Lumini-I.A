const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe Webhook Handler
// This ensures that plan updates happen even if the user closes the browser
router.post('/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // In production, verify the webhook signature
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (endpointSecret) {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
        // Only for development/test without signature verification (be careful!)
        console.warn("⚠️ Warning: Stripe Webhook Signature verification disabled (STRIPE_WEBHOOK_SECRET not set).");
        event = req.body;
    }
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
        
        // Determine plan based on amount
        let newPlan = 'pro'; // Default
        
        // Check amount_paid (in cents)
        // Pro: 4900, Premium: 9900
        if (session.amount_paid === 9900) {
            newPlan = 'premium';
        } else if (session.amount_paid === 4900) {
            newPlan = 'pro';
        } else if (session.amount_paid > 5000) {
            // Fallback for future plans with higher price
            newPlan = 'premium';
        }

        await User.update({ plan: newPlan }, { where: { email } });
        console.log(`[Stripe Webhook] User ${email} plan updated to ${newPlan}`);
      }
      break;
      
    case 'customer.subscription.updated':
      const sub = event.data.object;
      // Logic to handle plan changes (upgrade/downgrade)
      // Usually we look at sub.items.data[0].price.id
      break;
      
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      console.log(`[Stripe Webhook] Subscription deleted: ${subscription.id}`);
      
      try {
        // Fetch customer to get email
        const customerId = subscription.customer;
        const customer = await stripe.customers.retrieve(customerId);
        
        if (customer && customer.email) {
            await User.update({ plan: 'free' }, { where: { email: customer.email } });
            console.log(`[Stripe Webhook] User ${customer.email} downgraded to FREE.`);
            
            // Optional: Send final confirmation email that plan has ended
            // await sendCancellationEmail({ email: customer.email, name: customer.name }, 'Período de assinatura encerrado.');
        } else {
            console.log(`[Stripe Webhook] Could not find user email for customer ${customerId}`);
        }
      } catch (err) {
          console.error('[Stripe Webhook] Error processing subscription deletion:', err);
      }
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
        // Create Transaction
        await Transaction.create({
            description: `Hotmart Sale: ${prod_name}`,
            amount: price,
            type: 'income',
            source: 'Hotmart',
            date: new Date(),
            userId: user.id
        });

        // Create Invoice (NFS-e)
        // Simulate extracting buyer info from webhook payload
        const buyerName = req.body.first_name || 'Cliente Hotmart';
        const buyerDoc = req.body.doc || '000.000.000-00';
        const buyerEmail = req.body.email || 'cliente@email.com';
        const buyerAddress = req.body.address 
            ? `${req.body.address}, ${req.body.address_number || ''} - ${req.body.address_city || ''}/${req.body.address_state || ''}`
            : 'Endereço não informado';

        const newInvoice = await Invoice.create({
            userId: user.id,
            clientName: buyerName,
            clientDocument: buyerDoc,
            clientEmail: buyerEmail,
            clientAddress: buyerAddress,
            serviceDescription: `Curso Online: ${prod_name}`,
            amount: price,
            status: 'issued',
            issueDate: new Date(),
            externalReference: req.body.hottok || 'hotmart-ref'
        });

        // Send Email
        if (buyerEmail) {
            sendInvoiceEmail(buyerEmail, {
                id: newInvoice.id,
                clientName: buyerName,
                serviceDescription: `Curso Online: ${prod_name}`,
                amount: price,
                issueDate: newInvoice.issueDate
            });
        }
        
        console.log(`[Webhook] Processed sale for ${user.email}: ${prod_name} - R$ ${price}`);
        console.log(`[Webhook] Invoice #${newInvoice.id} generated automatically.`);
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;