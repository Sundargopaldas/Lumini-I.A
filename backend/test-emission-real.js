require('dotenv').config();
const axios = require('axios');
const nuvemFiscalService = require('./services/nuvemFiscalService');

async function testEmission() {
    console.log('--- TESTE DE EMISSÃO REAL (Sandbox) ---');

    // 1. Mock Issuer (User)
    const issuer = {
        cpfCnpj: '61.295.645/0001-93', // Correct CNPJ
        name: 'LUMINI I.A LTDA',
        address: 'Rua Teste, 100, São Paulo - SP',
        email: 'contato@lumini.ai'
    };

    // 2. Mock Invoice
    const invoice = {
        id: 9999, // Fake ID
        clientName: 'Cliente Teste Sandbox',
        clientDocument: '123.456.789-00', // CPF (Valid format, but might need real CPF for sandbox?)
        clientEmail: 'cliente@teste.com',
        clientAddress: 'Av. Paulista, 1000',
        serviceDescription: 'Consultoria em Software',
        amount: 100.00
    };

    try {
        console.log('--- PROBING ENDPOINTS ---');
        // Request broader scope to test permissions
        const token = await nuvemFiscalService.authenticate(); 
        console.log('Token obtido:', token ? `${token.substring(0, 20)}...` : 'NULL');

        // 0. GET /empresas (Check Auth & Environment)
        try {
            console.log('Testing GET https://api.sandbox.nuvemfiscal.com.br/empresas ...');
            const res = await axios.get('https://api.sandbox.nuvemfiscal.com.br/empresas', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`✅ GET /empresas: OK - ${res.data.count} empresas encontradas.`);
            console.log('Empresas:', JSON.stringify(res.data.data, null, 2));
        } catch (e) {
            console.log(`❌ GET /empresas: ${e.response?.status} - ${e.response?.statusText}`);
            if (e.response?.data) console.log(JSON.stringify(e.response.data));
        }

        // 2. POST /nfse/dps (Probe Payload)
        try {
            console.log('Testing POST https://api.sandbox.nuvemfiscal.com.br/nfse/dps with skeletal payload...');
            const payload = {
                ambiente: 'homologacao',
                infDPS: {
                    dhEmi: new Date().toISOString(),
                    prest: {
                        CNPJ: '61295645000193'
                    },
                    toma: {
                        xNome: 'Tomador Teste'
                    },
                    serv: {
                        cServ: {
                            xDescServ: 'Serviço Teste'
                        }
                    }
                }
            };
            await axios.post('https://api.sandbox.nuvemfiscal.com.br/nfse/dps', payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ POST /nfse/dps: OK (Payload Accepted!)');
        } catch (e) {
            console.log(`❌ POST /nfse/dps: ${e.response?.status}`);
            if (e.response?.data) {
                 console.log('Errors:', JSON.stringify(e.response.data, null, 2));
            }
        }


    } catch (error) {
        console.log('❌ ERRO NA EMISSÃO:');
        console.log(error.message);
        if (error.response && error.response.data) {
             console.log('Detalhes:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testEmission();