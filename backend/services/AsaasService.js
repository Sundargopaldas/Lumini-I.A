const axios = require('axios');

class AsaasService {
    // --- Helper to get headers ---
    _getHeaders(apiKey) {
        // Mock fallback
        if (!apiKey || apiKey === 'mock_key_dev') return null;
        
        // Auto-detect Sandbox
        let token = apiKey;
        if (apiKey.includes('hmlg') || apiKey.startsWith('$aact_hmlg') || apiKey.startsWith('sandbox_')) {
            token = apiKey.startsWith('sandbox_') ? apiKey.replace('sandbox_', '') : apiKey;
        }
        return { access_token: token };
    }

    _getBaseUrl(apiKey) {
        if (apiKey && (apiKey.includes('hmlg') || apiKey.startsWith('$aact_hmlg') || apiKey.startsWith('sandbox_'))) {
            return 'https://sandbox.asaas.com/api/v3';
        }
        return 'https://www.asaas.com/api/v3';
    }

    /**
     * Creates or retrieves a customer in Asaas
     */
    async createCustomer(apiKey, customerData) {
        if (!apiKey || apiKey === 'mock_key_dev') return 'cus_mock_123';
        
        const baseUrl = this._getBaseUrl(apiKey);
        const headers = this._getHeaders(apiKey);

        try {
            // 1. Check if customer exists by email (simple deduplication)
            const search = await axios.get(`${baseUrl}/customers?email=${customerData.email}`, { headers });
            if (search.data.data && search.data.data.length > 0) {
                return search.data.data[0].id;
            }

            // 2. Create new customer
            const response = await axios.post(`${baseUrl}/customers`, {
                name: customerData.name,
                email: customerData.email,
                cpfCnpj: customerData.cpfCnpj
            }, { headers });
            
            return response.data.id;
        } catch (error) {
            const errorMsg = error.response?.data?.errors?.[0]?.description || error.response?.data?.message || error.message;
            console.error('Asaas Create Customer Error:', error.response?.data || error.message);
            throw new Error(`Falha ao criar cliente no Asaas: ${errorMsg}`);
        }
    }

    async getCustomerById(apiKey, customerId) {
        if (!apiKey || apiKey === 'mock_key_dev') return { email: 'mock@email.com', name: 'Mock User' };
        
        const baseUrl = this._getBaseUrl(apiKey);
        const headers = this._getHeaders(apiKey);

        try {
            const response = await axios.get(`${baseUrl}/customers/${customerId}`, { headers });
            return response.data;
        } catch (error) {
            console.error('Asaas Get Customer Error:', error.response?.data || error.message);
            throw new Error('Falha ao buscar cliente no Asaas.');
        }
    }

    /**
     * Creates a subscription
     */
    async createSubscription(apiKey, subscriptionData) {
        if (!apiKey || apiKey === 'mock_key_dev') {
             return { 
                 id: 'sub_mock_123', 
                 status: 'PENDING', 
                 invoiceUrl: 'https://sandbox.asaas.com/sandbox/pay/mock' 
             };
        }

        const baseUrl = this._getBaseUrl(apiKey);
        const headers = this._getHeaders(apiKey);

        try {
            const payload = {
                customer: subscriptionData.customerId,
                billingType: subscriptionData.billingType, // BOLETO, PIX, CREDIT_CARD
                value: subscriptionData.value,
                nextDueDate: subscriptionData.nextDueDate, // YYYY-MM-DD
                cycle: 'MONTHLY',
                description: subscriptionData.description
            };

            // Add Credit Card info if provided
            if (subscriptionData.billingType === 'CREDIT_CARD' && subscriptionData.creditCard) {
                payload.creditCard = subscriptionData.creditCard;
                payload.creditCardHolderInfo = subscriptionData.creditCardHolderInfo;
            }

            const response = await axios.post(`${baseUrl}/subscriptions`, payload, { headers });

            // 3. If invoiceUrl is missing (common in subscriptions), fetch the first payment
            let invoiceUrl = response.data.invoiceUrl;
            if (!invoiceUrl) {
                try {
                    const payments = await axios.get(`${baseUrl}/subscriptions/${response.data.id}/payments`, { headers });
                    if (payments.data.data && payments.data.data.length > 0) {
                        invoiceUrl = payments.data.data[0].invoiceUrl;
                    }
                } catch (payErr) {
                    console.warn('Could not fetch initial payment for subscription:', payErr.message);
                }
            }

            return {
                id: response.data.id,
                status: response.data.status,
                invoiceUrl: invoiceUrl || 'https://sandbox.asaas.com' // Fallback
            };
        } catch (error) {
            const errorMsg = error.response?.data?.errors?.[0]?.description || error.response?.data?.message || error.message;
            console.error('Asaas Create Subscription Error:', error.response?.data || error.message);
            throw new Error(`Falha ao criar assinatura no Asaas: ${errorMsg}`);
        }
    }

    async fetchReceivables(apiKey) {
        // Mock fallback if no key provided (or for dev/testing without key)
        if (!apiKey || apiKey === 'mock_key_dev') {
            return this.getMockData();
        }

        try {
            const baseUrl = this._getBaseUrl(apiKey);
            const headers = this._getHeaders(apiKey);

            if (baseUrl.includes('sandbox')) {
                console.log('Asaas Service: Using Sandbox Environment');
            }

            const response = await axios.get(`${baseUrl}/payments`, {
                headers,
                params: {
                    limit: 20,
                    status: 'RECEIVED' // Only fetch received payments
                }
            });

            return response.data.data.map(payment => ({
                description: payment.description || `Pagamento Asaas ${payment.id}`,
                amount: payment.value,
                type: 'income',
                date: payment.paymentDate || payment.dateCreated.split('T')[0],
                source: 'Asaas',
                method: payment.billingType // BOLETO, PIX, CREDIT_CARD
            }));

        } catch (error) {
            console.error('Asaas API Error:', error.response?.data || error.message);
            
            // If authentication fails, throw specific error
            if (error.response?.status === 401) {
                throw new Error('Chave de API do Asaas inválida ou expirada.');
            }

            // Fallback to mock if it's a network error in dev
            if (process.env.NODE_ENV === 'development') {
                console.warn('Falling back to mock data due to API error');
                return this.getMockData();
            }

            throw new Error('Falha ao sincronizar com Asaas.');
        }
    }

    getMockData() {
        const today = new Date().toISOString().split('T')[0];
        return [
            {
                description: 'Boleto Pago - Cliente Marcos (Mock)',
                amount: 350.00,
                type: 'income',
                date: today,
                source: 'Asaas',
                method: 'BOLETO'
            },
            {
                description: 'Pix Recebido - Consultoria (Mock)',
                amount: 1200.00,
                type: 'income',
                date: today,
                source: 'Asaas',
                method: 'PIX'
            },
            {
                description: 'Taxa de Emissão Boleto (Mock)',
                amount: -1.99, // Negative for expense
                type: 'expense',
                date: today,
                source: 'Asaas',
                method: 'FEE'
            }
        ];
    }
}

module.exports = new AsaasService();