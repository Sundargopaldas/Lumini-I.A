const axios = require('axios');

async function testAsaasKey() {
    const apiKey = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojk2ZmFiZmE1LTUzZGYtNGQ0Ny04NjVjLTU3MTg4MmJlZDI3Mjo6JGFhY2hfMWY0NWJkNTEtYjBkZi00NWE3LWE5NjAtZTYzOWE3ZDllM2Q1';
    
    console.log('Testando conexão com Asaas Sandbox...');
    
    try {
        const response = await axios.get('https://sandbox.asaas.com/api/v3/payments', {
            headers: {
                'access_token': apiKey
            },
            params: {
                limit: 1
            }
        });

        console.log('✅ Sucesso! Conexão estabelecida.');
        console.log('Status:', response.status);
        console.log('Total de pagamentos encontrados:', response.data.totalCount);
        
        if (response.data.data.length > 0) {
            console.log('Último pagamento:', response.data.data[0].description, '- R$', response.data.data[0].value);
        } else {
            console.log('⚠️ Nenhum pagamento encontrado nesta conta de teste (mas a chave funciona).');
        }

    } catch (error) {
        console.error('❌ Erro na conexão:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Dados:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testAsaasKey();