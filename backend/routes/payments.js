const express = require('express');
const router = express.Router();
const User = require('../models/User');
// Initialize Stripe with the Secret Key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Map frontend plan names to details
// Amount is in cents (BRL)
const PLANS = {
    'premium': { name: 'Lumini Premium', amount: 9990 }, 
    'pro': { name: 'Lumini Pro', amount: 4990 }
};

router.post('/create-subscription', async (req, res) => {
    const { email, paymentMethodId, planName, name } = req.body;

    try {
        console.log(`Processing subscription for ${email} - Plan: ${planName}`);

        // 1. Create or Get Customer
        const customers = await stripe.customers.list({ email: email, limit: 1 });
        let customer;
        if (customers.data.length > 0) {
            customer = customers.data[0];
        } else {
            customer = await stripe.customers.create({ 
                email: email,
                name: name
            });
        }

        // 2. Attach Payment Method to Customer
        try {
            await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
        } catch (attachError) {
            // If already attached or other issue, log but try to proceed if possible, 
            // though usually this fails if not attached.
            console.error('Error attaching payment method:', attachError);
            throw attachError;
        }

        // Set as default payment method
        await stripe.customers.update(customer.id, {
            invoice_settings: { default_payment_method: paymentMethodId }
        });

        // 3. Get or Create Price dynamically (for demo purposes)
        // In a real app, you would use fixed Price IDs from your Stripe Dashboard
        const planKey = (planName || 'premium').toLowerCase();
        const planDetails = PLANS[planKey] || PLANS['premium'];
        
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
        // (Simple logic: if existing price matches amount, use it. Else create new.)
        if (!price || price.unit_amount !== planDetails.amount) {
            price = await stripe.prices.create({
                product: product.id,
                unit_amount: planDetails.amount,
                currency: 'brl',
                recurring: { interval: 'month' },
            });
        }

        // 4. Create Subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: price.id }],
            expand: ['latest_invoice.payment_intent'],
        });

        // UPDATE USER PLAN IN DB
        if (email) {
            const validPlan = ['pro', 'premium', 'agency'].includes(planKey) ? planKey : 'premium';
            await User.update({ plan: validPlan }, { where: { email: email } });
            console.log(`Updated user ${email} to plan ${validPlan}`);
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

module.exports = router;
