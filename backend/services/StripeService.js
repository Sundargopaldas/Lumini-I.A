
// Mock Service for Stripe Payments
// In production, use 'stripe' package

class StripeService {
    async getBalance() {
        // Mock balance from Stripe account
        return {
            available: 12500.50, // USD or converted BRL
            pending: 3200.00,
            currency: 'BRL'
        };
    }

    async fetchRecentPayments() {
        const today = new Date().toISOString().split('T')[0];
        
        return [
            {
                description: 'Venda Stripe #4492',
                amount: 197.00,
                type: 'income',
                date: today,
                source: 'Stripe',
                status: 'succeeded'
            },
            {
                description: 'Venda Stripe #4491',
                amount: 97.00,
                type: 'income',
                date: today,
                source: 'Stripe',
                status: 'succeeded'
            },
            {
                description: 'Stripe Payout (Transferência)',
                amount: 5000.00,
                type: 'expense', // Money leaving Stripe to Bank Account (technically a transfer, but can be modeled as expense in Stripe ledger or ignored if we track bank)
                // Actually, usually we track income. Let's stick to sales.
                date: today,
                source: 'Stripe',
                status: 'paid'
            }
        ];
    }
}

module.exports = new StripeService();
