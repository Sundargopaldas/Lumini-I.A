const axios = require('axios');

/**
 * Open Finance Service - Integração com Open Banking Brasil
 * Utilizando Pluggy como provedor de infraestrutura
 * Documentation: https://docs.pluggy.ai/
 */

const USE_SANDBOX = process.env.OPEN_FINANCE_USE_SANDBOX !== 'false';

class OpenFinanceService {

  /**
   * Inicializa cliente Pluggy
   */
  static getPluggyClient() {
    const clientId = process.env.PLUGGY_CLIENT_ID;
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.warn('[OpenFinance] Credenciais não configuradas. Usando modo SANDBOX.');
      return null;
    }

    return {
      clientId,
      clientSecret,
      baseUrl: USE_SANDBOX 
        ? 'https://api.pluggy.ai'
        : 'https://api.pluggy.ai'
    };
  }

  /**
   * Gera API Key temporário para autenticação do Pluggy Connect
   */
  static async generateConnectToken() {
    const client = this.getPluggyClient();
    
    // Se não tiver credenciais, retornar token sandbox
    if (!client) {
      console.log('[OpenFinance] Retornando token SANDBOX (sem credenciais)');
      return 'sandbox-token-' + Date.now();
    }

    try {
      const response = await axios.post(
        `${client.baseUrl}/auth`,
        {
          clientId: client.clientId,
          clientSecret: client.clientSecret
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.apiKey;
    } catch (error) {
      console.error('[OpenFinance] Erro ao gerar token:', error.response?.data || error.message);
      console.log('[OpenFinance] Fallback para modo SANDBOX');
      return 'sandbox-token-' + Date.now();
    }
  }

  /**
   * Lista bancos disponíveis para conexão
   */
  static async getAvailableConnectors() {
    const client = this.getPluggyClient();
    
    if (USE_SANDBOX || !client) {
      return this.mockConnectorsList();
    }

    try {
      const apiKey = await this.generateConnectToken();

      const response = await axios.get(
        `${client.baseUrl}/connectors`,
        {
          params: {
            countries: 'BR',
            types: 'PERSONAL_BANK,BUSINESS_BANK'
          },
          headers: {
            'X-API-KEY': apiKey
          }
        }
      );

      return response.data.results || [];
    } catch (error) {
      console.error('[OpenFinance] Erro ao listar bancos:', error.response?.data || error.message);
      return this.mockConnectorsList();
    }
  }

  /**
   * Busca contas conectadas do usuário
   * @param {string} itemId - ID do item conectado no Pluggy
   */
  static async getAccounts(itemId, apiKey) {
    const client = this.getPluggyClient();
    
    if (USE_SANDBOX || !client) {
      return this.mockAccounts();
    }

    try {
      const response = await axios.get(
        `${client.baseUrl}/accounts`,
        {
          params: { itemId },
          headers: {
            'X-API-KEY': apiKey
          }
        }
      );

      return response.data.results || [];
    } catch (error) {
      console.error('[OpenFinance] Erro ao buscar contas:', error.response?.data || error.message);
      return this.mockAccounts();
    }
  }

  /**
   * Busca transações bancárias
   * @param {string} accountId - ID da conta no Pluggy
   * @param {string} apiKey - API Key do Pluggy
   */
  static async fetchTransactions(accountId, apiKey) {
    const client = this.getPluggyClient();
    
    if (USE_SANDBOX || !client || !accountId) {
      console.log('[OpenFinance] Usando modo SANDBOX');
      return this.mockTransactions();
    }

    try {
      // Buscar transações dos últimos 90 dias
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 90);

      const response = await axios.get(
        `${client.baseUrl}/transactions`,
        {
          params: {
            accountId,
            from: fromDate.toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0]
          },
          headers: {
            'X-API-KEY': apiKey
          }
        }
      );

      console.log('[OpenFinance] Transações obtidas:', response.data.results?.length || 0);

      // Converter para formato Lumini
      const transactions = (response.data.results || []).map(tx => ({
        description: tx.description || 'Transação bancária',
        amount: Math.abs(parseFloat(tx.amount)),
        type: parseFloat(tx.amount) >= 0 ? 'income' : 'expense',
        source: 'Open Finance',
        date: tx.date,
        external_id: tx.id,
        category: tx.category || null
      }));

      return transactions;

    } catch (error) {
      console.error('[OpenFinance] Erro ao buscar transações:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Sessão expirada. Reconecte sua conta bancária.');
      }
      
      console.log('[OpenFinance] Fallback para modo SANDBOX');
      return this.mockTransactions();
    }
  }

  /**
   * Busca saldo atual das contas
   * @param {string} accountId - ID da conta no Pluggy
   * @param {string} apiKey - API Key do Pluggy
   */
  static async getBalance(accountId, apiKey) {
    const client = this.getPluggyClient();
    
    if (USE_SANDBOX || !client) {
      return this.mockBalance();
    }

    try {
      const response = await axios.get(
        `${client.baseUrl}/accounts/${accountId}`,
        {
          headers: {
            'X-API-KEY': apiKey
          }
        }
      );

      return {
        balance: response.data.balance || 0,
        currency: response.data.currencyCode || 'BRL',
        bankName: response.data.bankData?.name || 'Banco',
        accountType: response.data.type || 'CHECKING'
      };

    } catch (error) {
      console.error('[OpenFinance] Erro ao buscar saldo:', error.response?.data || error.message);
      return this.mockBalance();
    }
  }

  /**
   * Busca investimentos conectados
   * @param {string} itemId - ID do item no Pluggy
   * @param {string} apiKey - API Key do Pluggy
   */
  static async getInvestments(itemId, apiKey) {
    const client = this.getPluggyClient();
    
    if (USE_SANDBOX || !client) {
      return this.mockInvestments();
    }

    try {
      const response = await axios.get(
        `${client.baseUrl}/investments`,
        {
          params: { itemId },
          headers: {
            'X-API-KEY': apiKey
          }
        }
      );

      return response.data.results || [];
    } catch (error) {
      console.error('[OpenFinance] Erro ao buscar investimentos:', error.response?.data || error.message);
      return this.mockInvestments();
    }
  }

  // -------------------------------------------------------------------------
  // SANDBOX / SIMULATION MODE
  // -------------------------------------------------------------------------

  static mockConnectorsList() {
    return [
      {
        id: 1,
        name: 'Itaú',
        institutionUrl: 'https://www.itau.com.br',
        imageUrl: 'https://cdn.pluggy.ai/assets/connector-icons/itau.svg',
        primaryColor: '#EC7000',
        type: 'PERSONAL_BANK',
        country: 'BR'
      },
      {
        id: 2,
        name: 'Bradesco',
        institutionUrl: 'https://www.bradesco.com.br',
        imageUrl: 'https://cdn.pluggy.ai/assets/connector-icons/bradesco.svg',
        primaryColor: '#CC092F',
        type: 'PERSONAL_BANK',
        country: 'BR'
      },
      {
        id: 3,
        name: 'Banco do Brasil',
        institutionUrl: 'https://www.bb.com.br',
        imageUrl: 'https://cdn.pluggy.ai/assets/connector-icons/bb.svg',
        primaryColor: '#FFF100',
        type: 'PERSONAL_BANK',
        country: 'BR'
      },
      {
        id: 4,
        name: 'Nubank',
        institutionUrl: 'https://nubank.com.br',
        imageUrl: 'https://cdn.pluggy.ai/assets/connector-icons/nubank.svg',
        primaryColor: '#820AD1',
        type: 'PERSONAL_BANK',
        country: 'BR'
      },
      {
        id: 5,
        name: 'Santander',
        institutionUrl: 'https://www.santander.com.br',
        imageUrl: 'https://cdn.pluggy.ai/assets/connector-icons/santander.svg',
        primaryColor: '#EC0000',
        type: 'PERSONAL_BANK',
        country: 'BR'
      },
      {
        id: 6,
        name: 'Caixa Econômica',
        institutionUrl: 'https://www.caixa.gov.br',
        imageUrl: 'https://cdn.pluggy.ai/assets/connector-icons/caixa.svg',
        primaryColor: '#0066A1',
        type: 'PERSONAL_BANK',
        country: 'BR'
      },
      {
        id: 7,
        name: 'Inter',
        institutionUrl: 'https://www.bancointer.com.br',
        imageUrl: 'https://cdn.pluggy.ai/assets/connector-icons/inter.svg',
        primaryColor: '#FF7A00',
        type: 'PERSONAL_BANK',
        country: 'BR'
      }
    ];
  }

  static mockAccounts() {
    return [
      {
        id: 'acc-sandbox-checking',
        type: 'CHECKING',
        name: 'Conta Corrente',
        balance: 15420.50,
        currencyCode: 'BRL',
        bankData: {
          name: 'Nubank',
          logoUrl: 'https://cdn.pluggy.ai/assets/connector-icons/nubank.svg'
        }
      },
      {
        id: 'acc-sandbox-savings',
        type: 'SAVINGS',
        name: 'Poupança',
        balance: 8200.00,
        currencyCode: 'BRL',
        bankData: {
          name: 'Nubank',
          logoUrl: 'https://cdn.pluggy.ai/assets/connector-icons/nubank.svg'
        }
      }
    ];
  }

  static async mockTransactions() {
    console.log('[OpenFinance] (Sandbox) Gerando transações simuladas...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const transactions = [];
    const categories = [
      { name: 'Supermercado', type: 'expense' },
      { name: 'Transferência recebida', type: 'income' },
      { name: 'Restaurante', type: 'expense' },
      { name: 'Salário', type: 'income' },
      { name: 'Uber', type: 'expense' },
      { name: 'Pagamento recebido', type: 'income' },
      { name: 'Farmácia', type: 'expense' },
      { name: 'Conta de luz', type: 'expense' },
      { name: 'Reembolso', type: 'income' }
    ];

    // Gerar 15-25 transações dos últimos 30 dias
    const numTransactions = Math.floor(Math.random() * 11) + 15;
    
    for (let i = 0; i < numTransactions; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const txDate = new Date();
      txDate.setDate(txDate.getDate() - daysAgo);

      const category = categories[Math.floor(Math.random() * categories.length)];
      const amount = category.type === 'income' 
        ? (Math.random() * 1000 + 500).toFixed(2)
        : (Math.random() * 200 + 20).toFixed(2);

      transactions.push({
        description: category.name,
        amount: Math.abs(parseFloat(amount)),
        type: category.type,
        source: 'Open Finance',
        date: txDate.toISOString().split('T')[0],
        external_id: `SANDBOX-OF-${Date.now()}-${i}`,
        category: category.name
      });
    }

    return transactions;
  }

  static mockBalance() {
    return {
      balance: 15420.50,
      currency: 'BRL',
      bankName: 'Nubank',
      accountType: 'CHECKING'
    };
  }

  static mockInvestments() {
    return [
      {
        id: 'inv-1',
        name: 'Tesouro Selic 2027',
        type: 'FIXED_INCOME',
        balance: 25000.00,
        currencyCode: 'BRL',
        rate: 0.1365
      },
      {
        id: 'inv-2',
        name: 'CDB 110% CDI',
        type: 'FIXED_INCOME',
        balance: 18500.00,
        currencyCode: 'BRL',
        rate: 0.1486
      }
    ];
  }
}

module.exports = OpenFinanceService;
