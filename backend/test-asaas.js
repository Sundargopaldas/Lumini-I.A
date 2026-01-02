
require('dotenv').config();
const asaasService = require('./services/AsaasService');

// Hardcoded key from payments.js for reproduction
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojk2ZmFiZmE1LTUzZGYtNGQ0Ny04NjVjLTU3MTg4MmJlZDI3Mjo6JGFhY2hfMWY0NWJkNTEtYjBkZi00NWE3LWE5NjAtZTYzOWE3ZDllM2Q1';

async function testAsaas() {
    console.log('--- Starting Asaas Test ---');
    console.log('Key:', ASAAS_API_KEY.substring(0, 20) + '...');

    // asaasService is already an instance

    try {
        console.log('\n1. Creating Customer...');
        const customerId = await asaasService.createCustomer(ASAAS_API_KEY, {
            name: 'Teste Script Debug',
            email: 'test_debug_' + Date.now() + '@lumini.ai',
            cpfCnpj: '43378887000160' // Example CNPJ
        });
        console.log('Customer ID:', customerId);

        console.log('\n2. Creating Subscription...');
        const nextDueDate = new Date();
        nextDueDate.setDate(nextDueDate.getDate() + 0);
        const dateString = nextDueDate.toISOString().split('T')[0];

        const subscriptionPayload = {
            customerId,
            billingType: 'CREDIT_CARD',
            value: 1.00,
            nextDueDate: dateString,
            description: 'Assinatura Teste Debug',
            creditCard: {
                holderName: 'TESTE HOLDER',
                number: '4539xxxxxxxx3974', // Invalid card for tokenization, but let's see if it fails validation
                expiryMonth: '06',
                expiryYear: '2028',
                ccv: '123'
            },
            creditCardHolderInfo: {
                name: 'Teste Holder',
                email: 'test@lumini.ai',
                cpfCnpj: '43378887000160',
                postalCode: '89223005',
                addressNumber: '123',
                phone: '4738010919'
            }
        };

        // Note: Sending raw credit card data might fail if Asaas requires tokenization, 
        // but let's see the error message.
        // Actually, for CREDIT_CARD, we usually need more info.
        // Let's try BOLETO first as it is simpler and less prone to validation errors.
        
        const subscriptionPayloadBoleto = {
            customerId,
            billingType: 'BOLETO',
            value: 1.00,
            nextDueDate: dateString,
            description: 'Assinatura Teste Debug Boleto'
        };

        const subscription = await asaasService.createSubscription(ASAAS_API_KEY, subscriptionPayloadBoleto);
        console.log('Subscription Created:', subscription);

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testAsaas();
