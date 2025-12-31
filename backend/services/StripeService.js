
const Stripe = require('stripe');

class StripeService {
    async getBalance(apiKey) {
        if (!apiKey) throw new Error('API Key is required for Stripe Integration');
        if (apiKey.startsWith('pk_')) throw new Error('Invalid API Key. Please use a Secret Key (sk_...) or Restricted Key (rk_...).');
        
        try {
            const stripe = Stripe(apiKey);
            const balance = await stripe.balance.retrieve();
            
            // Available balance
            const available = balance.available.reduce((acc, curr) => {
                return acc + (curr.amount / 100);
            }, 0);

            // Pending balance
            const pending = balance.pending.reduce((acc, curr) => {
                return acc + (curr.amount / 100);
            }, 0);

            return {
                available,
                pending,
                currency: balance.available[0]?.currency?.toUpperCase() || 'BRL'
            };
        } catch (error) {
            console.error('Stripe Balance Error:', error.message);
            throw new Error('Failed to fetch Stripe balance');
        }
    }

    async fetchRecentPayments(apiKey) {
        if (!apiKey) throw new Error('API Key is required for Stripe Integration');
        if (apiKey.startsWith('pk_')) throw new Error('Invalid API Key. Please use a Secret Key (sk_...) or Restricted Key (rk_...).');

        try {
            const stripe = Stripe(apiKey);
            
            // Fetch charges (payments received)
            const charges = await stripe.charges.list({
                limit: 20
            });

            return charges.data.map(charge => ({
                description: charge.description || `Stripe Charge ${charge.id.slice(-4)}`,
                amount: charge.amount / 100, // Stripe uses cents
                type: 'income',
                date: new Date(charge.created * 1000).toISOString().split('T')[0],
                source: 'Stripe',
                status: charge.status // succeeded, pending, failed
            }));

        } catch (error) {
            console.error('Stripe Fetch Error:', error.message);
            
            // Fallback for dev/demo if key is invalid or mock
            if (apiKey === 'mock_key_dev') {
                return this.getMockData();
            }
            
            throw error;
        }
    }

    getMockData() {
        const today = new Date().toISOString().split('T')[0];
        return [
            {
                description: 'Venda Stripe #4492 (Mock)',
                amount: 197.00,
                type: 'income',
                date: today,
                source: 'Stripe',
                status: 'succeeded'
            },
            {
                description: 'Venda Stripe #4491 (Mock)',
                amount: 97.00,
                type: 'income',
                date: today,
                source: 'Stripe',
                status: 'succeeded'
            }
        ];
    }
}

module.exports = new StripeService();
