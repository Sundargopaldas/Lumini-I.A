const axios = require('axios');

// Sua chave Sandbox que funcionou
const API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojk2ZmFiZmE1LTUzZGYtNGQ0Ny04NjVjLTU3MTg4MmJlZDI3Mjo6JGFhY2hfMWY0NWJkNTEtYjBkZi00NWE3LWE5NjAtZTYzOWE3ZDllM2Q1';

async function createMockData() {
    console.log('🚀 Iniciando criação de dados no Asaas Sandbox...');

    try {
        // 1. Criar um cliente fictício
        console.log('👤 Criando cliente...');
        const customer = await axios.post('https://sandbox.asaas.com/api/v3/customers', {
            name: 'Cliente Teste Lumini',
            cpfCnpj: '52998224725' // CPF gerado válido para teste
        }, { headers: { access_token: API_KEY } });
        
        const customerId = customer.data.id;
        console.log(`✅ Cliente criado: ${customerId}`);

        // 2. Criar uma cobrança de BOLETO (Paga)
        console.log('💸 Criando cobrança de Boleto...');
        const charge1 = await axios.post('https://sandbox.asaas.com/api/v3/payments', {
            customer: customerId,
            billingType: 'BOLETO',
            value: 1500.00,
            dueDate: new Date().toISOString().split('T')[0],
            description: 'Consultoria Financeira Lumini (Teste)'
        }, { headers: { access_token: API_KEY } });

        // Simular pagamento recebido (apenas em sandbox é possível via API se tiver permissão, 
        // mas vamos deixar criada para o Lumini listar como "Pendente" ou "Recebida" se fizermos o fluxo completo)
        console.log(`✅ Cobrança criada: ${charge1.data.id} - R$ 1.500,00`);

        // 3. Criar uma cobrança de BOLETO (Outra)
        console.log('💠 Criando segunda cobrança Boleto...');
        const charge2 = await axios.post('https://sandbox.asaas.com/api/v3/payments', {
            customer: customerId,
            billingType: 'BOLETO',
            value: 299.90,
            dueDate: new Date().toISOString().split('T')[0],
            description: 'Plano Mensal Lumini (Teste)'
        }, { headers: { access_token: API_KEY } });
        console.log(`✅ Segunda cobrança criada: ${charge2.data.id} - R$ 299,90`);

        console.log('\n🎉 Dados gerados com sucesso no Sandbox!');
        console.log('👉 Agora vá no Lumini, clique em "Sincronizar" no card do Asaas e veja a mágica.');

    } catch (error) {
        console.error('❌ Erro ao criar dados:', error.response?.data || error.message);
    }
}

createMockData();