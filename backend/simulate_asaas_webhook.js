const axios = require('axios');

const API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojk2ZmFiZmE1LTUzZGYtNGQ0Ny04NjVjLTU3MTg4MmJlZDI3Mjo6JGFhY2hfMWY0NWJkNTEtYjBkZi00NWE3LWE5NjAtZTYzOWE3ZDllM2Q1';
const WEBHOOK_URL = 'http://localhost:5000/api/webhooks/asaas';
const TARGET_EMAIL = 'luidmachado@yahoo.com'; // O email que aparece na fatura
const TARGET_AMOUNT = 49.00; // Valor da fatura

async function simulateWebhook() {
    console.log(`🔍 Buscando cliente no Asaas Sandbox com email: ${TARGET_EMAIL}...`);

    try {
        // 1. Buscar ID do Cliente
        const customerRes = await axios.get(`https://sandbox.asaas.com/api/v3/customers?email=${TARGET_EMAIL}`, {
            headers: { access_token: API_KEY }
        });

        if (!customerRes.data.data || customerRes.data.data.length === 0) {
            console.error('❌ Cliente não encontrado no Asaas Sandbox com este email.');
            return;
        }

        const customerId = customerRes.data.data[0].id;
        console.log(`✅ Cliente encontrado: ${customerId} (${customerRes.data.data[0].name})`);

        // 2. Montar Payload do Webhook
        const payload = {
            event: 'PAYMENT_RECEIVED',
            payment: {
                id: 'pay_simulated_' + Date.now(),
                customer: customerId,
                value: TARGET_AMOUNT,
                netValue: TARGET_AMOUNT,
                billingType: 'BOLETO',
                status: 'RECEIVED',
                description: 'Assinatura Lumini Pro (Simulação)',
                paymentDate: new Date().toISOString().split('T')[0]
            }
        };

        console.log('🚀 Enviando webhook simulado para o backend...');
        
        // 3. Enviar Webhook
        const webhookRes = await axios.post(WEBHOOK_URL, payload);

        console.log('🎉 Webhook enviado com sucesso!');
        console.log('Resposta do Backend:', webhookRes.data);
        console.log('\n👉 Verifique se o plano do usuário foi atualizado no banco de dados/dashboard.');

    } catch (error) {
        console.error('❌ Erro na simulação:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

simulateWebhook();
