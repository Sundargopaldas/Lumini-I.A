
// Mock Service for Open Finance (Pluggy)
// In production, this would use 'pluggy-sdk'

class PluggyService {
    constructor() {
        this.baseUrl = 'https://api.pluggy.ai';
    }

    async createConnectToken(itemId = null) {
        // Returns a token for the frontend widget
        return { accessToken: 'mock_connect_token_' + Date.now() };
    }

    async fetchTransactions(itemId) {
        // Mock data simulating a real bank connection via Open Finance
        // In real life, we would call client.fetchTransactions(accountId)
        
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        return [
            {
                description: 'Supermercado Pão de Açúcar',
                amount: 450.25,
                type: 'expense',
                date: today,
                category: 'Alimentação',
                provider: 'Itaú (Via Pluggy)'
            },
            {
                description: 'Posto Ipiranga',
                amount: 220.00,
                type: 'expense',
                date: yesterday,
                category: 'Transporte',
                provider: 'Itaú (Via Pluggy)'
            },
            {
                description: 'Pix Recebido - Cliente A',
                amount: 1500.00,
                type: 'income',
                date: today,
                category: 'Vendas',
                provider: 'Itaú (Via Pluggy)'
            },
            {
                description: 'Netflix Assinatura',
                amount: 55.90,
                type: 'expense',
                date: yesterday,
                category: 'Lazer',
                provider: 'Nubank (Via Pluggy)'
            }
        ];
    }
}

module.exports = new PluggyService();
