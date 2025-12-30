
// Mock Service for Asaas (Boletos & Pix)
// In production, use axios to call Asaas API v3

class AsaasService {
    async fetchReceivables() {
        const today = new Date().toISOString().split('T')[0];
        
        return [
            {
                description: 'Boleto Pago - Cliente Marcos',
                amount: 350.00,
                type: 'income',
                date: today,
                source: 'Asaas',
                method: 'BOLETO'
            },
            {
                description: 'Pix Recebido - Consultoria',
                amount: 1200.00,
                type: 'income',
                date: today,
                source: 'Asaas',
                method: 'PIX'
            },
            {
                description: 'Taxa de Emissão Boleto',
                amount: 1.99,
                type: 'expense',
                date: today,
                source: 'Asaas',
                method: 'FEE'
            }
        ];
    }
}

module.exports = new AsaasService();
