
require('dotenv').config();
const axios = require('axios');
const NuvemFiscalService = require('./services/nuvemFiscalService');

async function setupCompany() {
    console.log('--- CONFIGURANDO EMPRESA NO NUVEM FISCAL (Sandbox) ---');
    const service = NuvemFiscalService;
    const cnpj = '61295645000193';

    try {
        const token = await service.authenticate();
        console.log('Autenticado.');

        // Endpoint: PUT /empresas/{cpf_cnpj}/nfse
        const url = `https://api.sandbox.nuvemfiscal.com.br/empresas/${cnpj}/nfse`;
        
        // Configuration Payload
        // Assuming Simples Nacional and standard setup
        const payload = {
            regTrib: {
                opSimpNac: 1, // 1 - Simples Nacional
                regEspTrib: 1 // 1 - Microempresa Municipal (Example)
            },
            rps: {
                    serie: '1',
                    numero: 1,
                    lote: 1
            },
            // Environment configuration for emission
            ambiente: 'homologacao'
        };

        console.log(`Configuring company ${cnpj}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Empresa configurada com sucesso!');
        console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('❌ Erro ao configurar empresa:');
        if (error.response) {
            console.error(`${error.response.status} - ${error.response.statusText}`);
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

setupCompany();
