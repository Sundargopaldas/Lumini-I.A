const axios = require('axios');

// Service to handle Hotmart API
// Documentation: https://developers.hotmart.com/docs/pt-BR/v1/introduction
const USE_SANDBOX = process.env.HOTMART_USE_SANDBOX !== 'false'; // Usa sandbox por padrão, exceto se explicitamente desabilitado

class HotmartService {
    
    /**
     * Gera URL de autenticação OAuth2 para Hotmart
     * @param {number} userId - ID do usuário para state
     */
    static getAuthUrl(userId) {
      const clientId = process.env.HOTMART_CLIENT_ID;
      const redirectUri = process.env.HOTMART_REDIRECT_URI || 'https://www.luminiiadigital.com.br/api/integrations/hotmart/callback';
      
      if (!clientId) {
        throw new Error('HOTMART_CLIENT_ID não configurado');
      }

      const authUrl = `https://api-sec-vlc.hotmart.com/security/oauth/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${userId}`;

      return authUrl;
    }

    /**
     * Troca código de autorização por tokens de acesso
     * @param {string} code - Código de autorização
     */
    static async exchangeCodeForTokens(code) {
      const clientId = process.env.HOTMART_CLIENT_ID;
      const clientSecret = process.env.HOTMART_CLIENT_SECRET;
      const redirectUri = process.env.HOTMART_REDIRECT_URI || 'https://www.luminiiadigital.com.br/api/integrations/hotmart/callback';

      if (!clientId || !clientSecret) {
        throw new Error('Credenciais Hotmart não configuradas');
      }

      try {
        const response = await axios.post(
          'https://api-sec-vlc.hotmart.com/security/oauth/token',
          new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );

        return {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          expires_in: response.data.expires_in,
          expiry_date: Date.now() + (response.data.expires_in * 1000)
        };
      } catch (error) {
        console.error('[HotmartService] Erro ao trocar código por tokens:', error.response?.data || error.message);
        throw error;
      }
    }

    /**
     * Atualiza tokens usando refresh_token
     * @param {string} refreshToken - Refresh token
     */
    static async refreshAccessToken(refreshToken) {
      const clientId = process.env.HOTMART_CLIENT_ID;
      const clientSecret = process.env.HOTMART_CLIENT_SECRET;

      try {
        const response = await axios.post(
          'https://api-sec-vlc.hotmart.com/security/oauth/token',
          new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );

        return {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token || refreshToken,
          expires_in: response.data.expires_in,
          expiry_date: Date.now() + (response.data.expires_in * 1000)
        };
      } catch (error) {
        console.error('[HotmartService] Erro ao atualizar token:', error.response?.data || error.message);
        throw error;
      }
    }

    /**
     * Busca vendas da API real da Hotmart
     * @param {object} tokens - Tokens OAuth (access_token, refresh_token, expiry_date)
     */
    static async fetchSales(tokens = null) {
      if (USE_SANDBOX || !tokens) {
        console.log('[HotmartService] Usando modo SANDBOX');
        return this.mockHotmartResponse();
      }

      try {
        // Verificar se token expirou
        if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
          console.log('[HotmartService] Token expirado, renovando...');
          tokens = await this.refreshAccessToken(tokens.refresh_token);
        }

        // Buscar vendas dos últimos 30 dias
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const endDate = new Date();

        const response = await axios.get(
          'https://developers.hotmart.com/payments/api/v1/sales/history',
          {
            params: {
              start_date: startDate.getTime(),
              end_date: endDate.getTime(),
              transaction_status: 'APPROVED', // Apenas vendas aprovadas
              max_results: 100
            },
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('[HotmartService] Vendas obtidas:', response.data.items?.length || 0);

        // Converter para formato Lumini
        const transactions = (response.data.items || []).map(sale => ({
          description: `Venda Hotmart: ${sale.product.name}`,
          amount: parseFloat(sale.price.value),
          type: 'income',
          source: 'Hotmart',
          date: new Date(sale.purchase.approved_date).toISOString().split('T')[0],
          external_id: sale.transaction
        }));

        return transactions;

      } catch (error) {
        console.error('[HotmartService] Erro ao buscar vendas:', error.response?.data || error.message);
        
        // Se erro de autenticação, retornar erro específico
        if (error.response?.status === 401) {
          throw new Error('Token de acesso inválido. Reconecte sua conta Hotmart.');
        }
        
        throw error;
      }
    }

    /**
     * Busca comissões de afiliado
     * @param {object} tokens - Tokens OAuth
     */
    static async fetchAffiliateCommissions(tokens) {
      if (USE_SANDBOX || !tokens) {
        return [];
      }

      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const response = await axios.get(
          'https://developers.hotmart.com/payments/api/v1/sales/commissions',
          {
            params: {
              start_date: startDate.getTime(),
              max_results: 100
            },
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const commissions = (response.data.items || []).map(comm => ({
          description: `Comissão Hotmart: ${comm.product.name}`,
          amount: parseFloat(comm.commission.value),
          type: 'income',
          source: 'Hotmart - Afiliado',
          date: new Date(comm.purchase.approved_date).toISOString().split('T')[0],
          external_id: comm.transaction
        }));

        return commissions;
      } catch (error) {
        console.error('[HotmartService] Erro ao buscar comissões:', error.response?.data || error.message);
        return [];
      }
    }

    // -------------------------------------------------------------------------
    // SANDBOX / SIMULATION MODE
    // -------------------------------------------------------------------------
    static async mockHotmartResponse() {
      console.log(`[HotmartService] (Sandbox) Gerando vendas simuladas...`);
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate latency
  
      const today = new Date().toISOString().split('T')[0];
      
      // Generate 2-5 random sales
      const numberOfSales = Math.floor(Math.random() * 4) + 2;
      const transactions = [];

      const products = [
        'Curso Marketing Digital Avançado',
        'E-book Finanças Pessoais',
        'Mentoria VIP 1:1',
        'Workshop de Vendas Online',
        'Treinamento Instagram Profissional'
      ];

      for (let i = 0; i < numberOfSales; i++) {
        const randomAmount = (Math.random() * 300 + 97).toFixed(2); // 97-397
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        
        // Gerar data aleatória nos últimos 15 dias
        const daysAgo = Math.floor(Math.random() * 15);
        const saleDate = new Date();
        saleDate.setDate(saleDate.getDate() - daysAgo);

        transactions.push({
          description: `Venda Hotmart: ${randomProduct}`,
          amount: parseFloat(randomAmount),
          type: 'income',
          source: 'Hotmart',
          date: saleDate.toISOString().split('T')[0],
          external_id: `SANDBOX-${Date.now()}-${i}`
        });
      }

      // Adicionar algumas comissões de afiliado
      if (Math.random() > 0.5) {
        const commAmount = (Math.random() * 150 + 47).toFixed(2);
        transactions.push({
          description: 'Comissão Hotmart: Produto de Parceiro',
          amount: parseFloat(commAmount),
          type: 'income',
          source: 'Hotmart - Afiliado',
          date: today,
          external_id: `SANDBOX-COMM-${Date.now()}`
        });
      }

      return transactions;
    }
  }
  
  module.exports = HotmartService;
