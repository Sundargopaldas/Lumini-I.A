const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const AsaasService = require('../services/AsaasService');

// Use environment variable or fallback to the Sandbox key provided by user for testing
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojk2ZmFiZmE1LTUzZGYtNGQ0Ny04NjVjLTU3MTg4MmJlZDI3Mjo6JGFhY2hfMWY0NWJkNTEtYjBkZi00NWE3LWE5NjAtZTYzOWE3ZDllM2Q1';

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
      // Logic to handle plan changes (upgrade/downgrade)
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

// Asaas Webhook Handler
router.post('/asaas', express.json(), async (req, res) => {
  try {
    const { event, payment } = req.body;
    const token = req.headers['asaas-access-token'];
    
    // Optional: Verify token if configured
    // if (token !== process.env.ASAAS_WEBHOOK_TOKEN) ...

    console.log(`[Asaas Webhook] Event: ${event} for Payment: ${payment?.id}`);

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
        let newPlan = 'pro';
        // Determine plan based on description or value
        if (payment.description && payment.description.toLowerCase().includes('premium')) {
            newPlan = 'premium';
        } else if (payment.value >= 90) {
            newPlan = 'premium';
        } else if (payment.value >= 40) {
            newPlan = 'pro';
        }

        // Fetch Customer to get email
        if (payment.customer) {
            try {
                const asaasService = new AsaasService();
                const customerData = await asaasService.getCustomerById(ASAAS_API_KEY, payment.customer);
                
                if (customerData && customerData.email) {
                    const email = customerData.email;
                    
                    // Update User Plan
                    const user = await User.findOne({ where: { email } });
                    if (user) {
                        user.plan = newPlan;
                        await user.save();
                        console.log(`[Asaas Webhook] User ${email} plan updated to ${newPlan} via Asaas.`);
                        
                        // Create Transaction Record
                        await Transaction.create({
                            description: `Assinatura Lumini ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)} (Asaas)`,
                            amount: payment.value,
                            type: 'income',
                            source: 'Asaas',
                            date: new Date(),
                            userId: user.id
                        });
                    } else {
                        console.warn(`[Asaas Webhook] User with email ${email} not found in local DB.`);
                    }
                }
            } catch (custErr) {
                console.error(`[Asaas Webhook] Failed to fetch customer ${payment.customer}:`, custErr.message);
            }
        }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Asaas Webhook] Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Webhook Receiver for Hotmart (Simulation)
router.post('/hotmart', async (req, res) => {
  try {
    const { prod_name, price, email, status } = req.body;
    
    // 1. Identify User
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
