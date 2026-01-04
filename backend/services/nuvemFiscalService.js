const axios = require('axios');

class NuvemFiscalService {
    constructor() {
        // Use sandbox for dev, production for live. 
        // Ideally controlled by an env var like NUVEM_FISCAL_ENV=sandbox
        this.baseUrl = process.env.NUVEM_FISCAL_ENV === 'production' 
            ? 'https://api.nuvemfiscal.com.br' 
            : 'https://api.sandbox.nuvemfiscal.com.br';
            
        this.token = null;
        this.tokenExpiry = null;
    }

    async authenticate() {
        // Return cached token if valid
        if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.token;
        }

        const clientId = process.env.NUVEM_FISCAL_CLIENT_ID;
        const clientSecret = process.env.NUVEM_FISCAL_CLIENT_SECRET;
        const scope = 'cnpj nfe nfce nfse cte mdfe empresa';

        if (!clientId || !clientSecret) {
            // If credentials are missing, we can't emit real invoices.
            // For now, return null to indicate not configured.
            return null;
        }

        try {
            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_id', clientId);
            params.append('client_secret', clientSecret);
            params.append('scope', scope);

            const response = await axios.post(`https://auth.nuvemfiscal.com.br/oauth/token`, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            this.token = response.data.access_token;
            const expiresIn = response.data.expires_in || 3600;
            // Buffer of 60 seconds
            this.tokenExpiry = new Date(Date.now() + (expiresIn - 60) * 1000);

            return this.token;
        } catch (error) {
            console.error('Nuvem Fiscal Auth Error:', error.response?.data || error.message);
            throw new Error('Falha na autenticação com a Nuvem Fiscal. Verifique as credenciais.');
        }
    }

    /**
     * Registers a Digital Certificate (A1) for a company
     * @param {string} cpfCnpj - Company CNPJ
     * @param {Buffer} certificateBuffer - The .pfx file content
     * @param {string} password - The certificate password
     */
    async registerCertificate(cpfCnpj, certificateBuffer, password) {
        // SIMULATION MODE CHECK
        if (process.env.NUVEM_FISCAL_MOCK === 'true') {
            console.log('--- NUVEM FISCAL MOCK: Fake Certificate Registration ---');
            return {
                id: 'MOCK-CERT-ID',
                serial_number: '1234567890',
                issuer_name: 'Autoridade Certificadora MOCK',
                expires_at: new Date(Date.now() + 31536000000).toISOString() // +1 year
            };
        }

        const token = await this.authenticate();
        if (!token) throw new Error('Credenciais da Nuvem Fiscal não configuradas.');

        // Endpoint: PUT /empresas/{cpf_cnpj}/certificado
        const cleanCnpj = cpfCnpj.replace(/\D/g, '');
        const url = `${this.baseUrl}/empresas/${cleanCnpj}/certificado`;

        // Prepare JSON payload with Base64 certificate
        const payload = {
            certificado: certificateBuffer.toString('base64'),
            senha: password
        };

        try {
            const response = await axios.put(url, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Nuvem Fiscal Cert Upload Error:', error.response?.data || error.message);
            if (error.response?.data?.error) {
                throw new Error(`Erro ao cadastrar certificado: ${error.response.data.error.message}`);
            }
            throw new Error(`Falha ao cadastrar certificado na Nuvem Fiscal: ${error.message}`);
        }
    }

    /**
     * Emits an NFS-e (Service Invoice)
     * @param {Object} invoice - Invoice data from DB
     * @param {Object} issuer - User data (the issuer)
     */
    async emitNfse(invoice, issuer) {
        // SIMULATION MODE CHECK
        if (process.env.NUVEM_FISCAL_MOCK === 'true') {
            console.log('--- NUVEM FISCAL MOCK MODE: Emitting Fake Invoice ---');
            return {
                id: `MOCK-${Date.now()}`,
                status: 'autorizada',
                numero: Math.floor(Math.random() * 1000),
                codigo_verificacao: 'TEST-1234-MOCK',
                link_pdf: 'https://www.nuvemfiscal.com.br/modelo-nfse.pdf', // Example PDF
                mensagem: 'Nota Fiscal emitida em modo de SIMULAÇÃO (Sandbox indisponível).',
                data_emissao: new Date().toISOString()
            };
        }

        const token = await this.authenticate();
        if (!token) {
            throw new Error('Credenciais da Nuvem Fiscal não configuradas no servidor.');
        }

        // --- MAPPING for DPS (Nacional Standard) ---
        // Endpoint: /nfse/dps
        
        // Ensure address is present for Toma (Taker)
        const takerAddress = {};
        if (invoice.clientAddress) {
             // Basic parsing or assuming full address string. 
             // Ideally, we should have structured address in DB (Street, Number, CEP, City, UF)
             // For now, we'll try to extract CEP if available
             const cepMatch = invoice.clientAddress.match(/\d{5}-?\d{3}/);
             if (cepMatch) {
                 takerAddress.CEP = cepMatch[0].replace(/\D/g, '');
             }
             // We can also try to infer UF from clientState
             if (invoice.clientState) {
                 takerAddress.UF = invoice.clientState;
             }
        }

        const payload = {
            ambiente: this.baseUrl.includes('sandbox') ? 'homologacao' : 'producao',
            infDPS: {
                dhEmi: new Date().toISOString(),
                dCompet: new Date().toISOString().split('T')[0], // YYYY-MM-DD
                prest: {
                    CNPJ: issuer.cpfCnpj ? issuer.cpfCnpj.replace(/\D/g, '') : '',
                },
                toma: {
                    xNome: invoice.clientName,
                    ...(invoice.clientEmail ? { email: invoice.clientEmail } : {}),
                    // Add address if available
                    ...(Object.keys(takerAddress).length > 0 ? { end: takerAddress } : {})
                },
                serv: {
                    cServ: {
                        cTribNac: '010101', // Placeholder: Analise e Des. Sistemas. TODO: Make dynamic based on user settings
                        xDescServ: invoice.serviceDescription
                    }
                },
                valores: {
                    vServPrest: {
                        vServ: Number(invoice.amount)
                    },
                    trib: {
                        tribMun: {
                            tribISSQN: 1, // 1 - Tributado no município (Default for most services)
                            tpRetISSQN: 2, // 2 - Não Retido (Default for Simples Nacional)
                            vISSQN: 0
                        }
                    }
                }
            }
        };

        // Handle Tomador Document (CPF or CNPJ)
        if (invoice.clientDocument) {
            const doc = invoice.clientDocument.replace(/\D/g, '');
            if (doc.length > 11) {
                payload.infDPS.toma.CNPJ = doc;
            } else {
                payload.infDPS.toma.CPF = doc;
            }
        }

        try {
            console.log('Sending DPS Payload:', JSON.stringify(payload, null, 2));
            const response = await axios.post(`${this.baseUrl}/nfse/dps`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Nuvem Fiscal Response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Nuvem Fiscal Emission Error:', error.response?.data || error.message);
            // Return validation errors if available
            if (error.response?.data?.error) {
                throw new Error(`Nuvem Fiscal: ${error.response.data.error.message} - ${JSON.stringify(error.response.data.error.errors || '')}`);
            }
            throw new Error(`Falha ao emitir NFS-e: ${error.message}`);
        }
    }
}

module.exports = new NuvemFiscalService();
