const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
// Initialize Stripe with the Secret Key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Map frontend plan names to details
// Amount is in cents (BRL)
const PLANS = {
    'premium': { 
        name: 'Lumini Premium', 
        amount: 9900,
        priceId: 'price_1SjgWT2OKONfldjliYgukClY' 
    }, 
    'pro': { 
        name: 'Lumini Pro', 
        amount: 4900,
        priceId: 'price_1SjgWT2OKONfldjlivd97hha' 
    }
};

router.post('/create-subscription', async (req, res) => {
    const { email, paymentMethodId, planName, name, cpfCnpj } = req.body;

    try {
        console.log(`Processing subscription for ${email} - Plan: ${planName}`);

        // --- DEV BYPASS: SIMULATED PAYMENT ---
        if (paymentMethodId === 'mock_payment_method_dev') {
            console.log('⚠️ MOCK PAYMENT DETECTED - Bypassing Stripe (Dev Mode)');
            const user = await User.findOne({ where: { email } });
            if (user) {
                user.plan = (planName || 'premium').toLowerCase();
                await user.save();
                console.log(`User ${user.email} upgraded to ${user.plan} (Mock)`);
                
                // Send Welcome Email
                sendWelcomeEmail(user, user.plan === 'premium' ? 'Premium' : 'Pro');
                
                return res.json({
                    status: 'active',
                    clientSecret: 'mock_secret_dev',
                    subscriptionId: 'sub_mock_dev_' + Date.now()
                });
            } else {
                 // Even if user not found (unlikely in this flow), return success to not break UI
                 return res.json({ status: 'active', clientSecret: 'mock', subscriptionId: 'mock' });
            }
        }
        // -------------------------------------

        // 1. Create or Get Customer
        const customers = await stripe.customers.list({ email: email, limit: 1 });
        let customer;
        
        // Helper to determine tax ID type
        const getTaxIdType = (value) => {
            const cleanValue = value.replace(/\D/g, '');
            if (cleanValue.length === 11) return 'br_cpf';
            if (cleanValue.length === 14) return 'br_cnpj';
            return null;
        };

        const taxIdType = cpfCnpj ? getTaxIdType(cpfCnpj) : null;
        const taxIdValue = cpfCnpj ? cpfCnpj.replace(/\D/g, '') : null;

        if (customers.data.length > 0) {
            customer = customers.data[0];
            
            // Try to add Tax ID to existing customer if provided
            if (taxIdType && taxIdValue) {
                try {
                    // Check if already has this tax ID to avoid duplication error (optional optimization)
                    // But simpler to just try-catch the creation
                    await stripe.customers.createTaxId(customer.id, {
                        type: taxIdType,
                        value: taxIdValue
                    });
                    console.log(`Added Tax ID (${taxIdType}) to existing customer ${customer.id}`);
                } catch (taxError) {
                    // Ignore if it already exists or invalid, just log
                    console.log(`Note: Could not add Tax ID to existing customer (might already exist): ${taxError.message}`);
                }
            }

        } else {
            const customerData = { 
                email: email,
                name: name
            };
            
            if (taxIdType && taxIdValue) {
                customerData.tax_id_data = [{
                    type: taxIdType,
                    value: taxIdValue
                }];
            }

            customer = await stripe.customers.create(customerData);
        }

        // 2. Attach Payment Method to Customer
        try {
            await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
        } catch (attachError) {
            console.error('Error attaching payment method:', attachError);
            throw attachError;
        }

        // Set as default payment method
        await stripe.customers.update(customer.id, {
            invoice_settings: { default_payment_method: paymentMethodId }
        });

        // 3. Determine Price ID
        const planKey = (planName || 'premium').toLowerCase();
        const planDetails = PLANS[planKey] || PLANS['premium'];
        
        let priceId = planDetails.priceId;

        // If no fixed price ID, try dynamic lookup/creation (Fallback)
        if (!priceId) {
            console.log(`No fixed priceId for ${planKey}, attempting dynamic lookup...`);
            
            // Find product by name
            const products = await stripe.products.search({ query: `name:'${planDetails.name}'` });
            let product = products.data.length > 0 ? products.data[0] : null;

            if (!product) {
                product = await stripe.products.create({ name: planDetails.name });
            }

            // Find price for product
            const prices = await stripe.prices.list({ product: product.id, limit: 1 });
            let price = prices.data.length > 0 ? prices.data[0] : null;

            // If no price or price amount mismatch, create new price
            if (!price || price.unit_amount !== planDetails.amount) {
                price = await stripe.prices.create({
                    product: product.id,
                    unit_amount: planDetails.amount,
                    currency: 'brl',
                    recurring: { interval: 'month' },
                });
            }
            priceId = price.id;
        }

        console.log(`Using Price ID: ${priceId}`);

        // 4. Create Subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            default_payment_method: paymentMethodId,
            expand: ['latest_invoice.payment_intent'],
        });

        // UPDATE USER PLAN IN DB
        if (email) {
            const validPlan = ['pro', 'premium', 'agency'].includes(planKey) ? planKey : 'premium';
            const updateData = { plan: validPlan };
            if (cpfCnpj) {
                updateData.cpfCnpj = cpfCnpj.replace(/\D/g, ''); // Store clean numbers
            }
            await User.update(updateData, { where: { email: email } });
            console.log(`Updated user ${email} to plan ${validPlan}`);

            // Send Welcome Email
            try {
                const userForEmail = await User.findOne({ where: { email } });
                if (userForEmail) {
                    sendWelcomeEmail(userForEmail, validPlan === 'premium' ? 'Premium' : 'Pro');
                }
            } catch (emailErr) {
                console.error('Error triggering welcome email:', emailErr);
            }
        }

        // 5. Respond to Frontend
        const clientSecret = subscription.latest_invoice && 
                             subscription.latest_invoice.payment_intent && 
                             subscription.latest_invoice.payment_intent.client_secret
                             ? subscription.latest_invoice.payment_intent.client_secret 
                             : null;

        res.json({
            subscriptionId: subscription.id,
            clientSecret: clientSecret,
            status: subscription.status
        });

    } catch (error) {
        console.error('Stripe Error:', error);
        res.status(400).json({ error: { message: error.message } });
    }
});

// List User Invoices (My Invoices)
router.get('/my-invoices', auth, async (req, res) => {
    try {
        // 1. Get User Email
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 2. Find Customer in Stripe
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (customers.data.length === 0) {
            return res.json([]); // No customer = no invoices
        }
        const customer = customers.data[0];

        // 3. List Invoices
        const invoices = await stripe.invoices.list({
            customer: customer.id,
            limit: 20,
            status: 'paid' // Optional: only show paid invoices? Or 'all'
        });

        // 4. Format Data
        const formattedInvoices = invoices.data.map(inv => ({
            id: inv.id,
            number: inv.number,
            date: new Date(inv.created * 1000).toLocaleDateString('pt-BR'),
            amount: (inv.amount_paid / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            status: inv.status,
            pdf: inv.invoice_pdf,
            hosted_url: inv.hosted_invoice_url
        }));

        res.json(formattedInvoices);

    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: 'Error fetching invoices' });
    }
});

const { sendCancellationEmail, sendWelcomeEmail } = require('../services/EmailService');

// Cancel Subscription
router.post('/cancel-subscription', auth, async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 1. Find Customer
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (customers.data.length === 0) {
            return res.status(404).json({ message: 'No subscription found (Customer not found)' });
        }
        const customer = customers.data[0];

        // 2. Find Active Subscription
        const subscriptions = await stripe.subscriptions.list({ 
            customer: customer.id, 
            limit: 1 
        });

        // Filter manually for relevant statuses if needed, or just log what we found
        const activeSub = subscriptions.data.find(sub => sub.status === 'active' || sub.status === 'trialing');
        
        if (!activeSub) {
             console.log(`[Cancel Subscription] No active subscription found for user ${user.email}. Found statuses: ${subscriptions.data.map(s => s.status).join(', ')}`);
             // Maybe they are already trialing or past_due, but let's assume active for now
             // If no active subscription, maybe update local DB to free just in case?
             await User.update({ plan: 'free' }, { where: { id: user.id } });
             return res.json({ message: 'Subscription already cancelled or not found. Plan reset to Free.' });
        }

        const subscription = activeSub;
        console.log(`[Cancel Subscription] Found subscription ${subscription.id} with status: ${subscription.status}`);

        // 3. Cancel at period end
        await stripe.subscriptions.update(subscription.id, {
            cancel_at_period_end: true
        });

        // 4. Send Feedback Email
        const finalReason = reason || 'Motivo não informado';
        console.log(`[Cancel Subscription] Attempting to send cancellation email to ${user.email} with reason: ${finalReason}`);
        
        try {
            // Pass plain object to avoid any Sequelize serialization issues
            await sendCancellationEmail({
                email: user.email,
                name: user.name
            }, finalReason);
            console.log(`[Cancel Subscription] Email sent successfully to ${user.email}`);
        } catch (emailError) {
            console.error(`[Cancel Subscription] CRITICAL ERROR sending email:`, emailError);
        }

        // Optionally update DB to reflect "cancellation pending" or just leave it until webhook fires?
        // For simplicity and user feedback, we might just tell them it's done.
        // We won't downgrade them immediately because they paid for the month.
        // We rely on the webhook 'customer.subscription.deleted' to actually set plan='free' later.

        res.json({ message: 'Assinatura cancelada com sucesso. Seu plano permanecerá ativo até o fim do período atual.' });

    } catch (error) {
        console.error('Cancel Subscription Error:', error);
        res.status(500).json({ message: 'Error cancelling subscription' });
    }
});

module.exports = router;
