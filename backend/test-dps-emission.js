
require('dotenv').config();
const NuvemFiscalService = require('./services/nuvemFiscalService');

// Mock data
const mockUser = {
    cpfCnpj: '61.295.645/0001-93', // Sandbox company
    name: 'Lumini I.A',
    email: 'contato@lumini.ai'
};

const mockInvoice = {
    id: 999,
    clientName: 'Tomador Teste Sandbox',
    clientDocument: '529.982.247-25', // Valid CPF
    clientEmail: 'tomador@teste.com',
    serviceDescription: 'Consultoria em Software',
    amount: 100.50
};

async function test() {
    console.log('--- TESTE DPS NUVEM FISCAL ---');
    const service = NuvemFiscalService;
    
    try {
        console.log('Autenticando...');
        await service.authenticate();
        console.log('Autenticado.');

        console.log('Emitindo NFS-e (DPS)...');
        const result = await service.emitNfse(mockInvoice, mockUser);
        console.log('RESULTADO:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('ERRO:', error.message);
    }
}

test();
