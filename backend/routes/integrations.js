const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Integration = require('../models/Integration');
const BankingService = require('../services/BankingService');
const YouTubeService = require('../services/YouTubeService');
const HotmartService = require('../services/HotmartService');
const PluggyService = require('../services/PluggyService');
const OpenFinanceService = require('../services/OpenFinanceService');
const { google } = require('googleapis');
// const StripeService = require('../services/StripeService'); // Removido: Stripe apenas para pagamentos, não integrações

// Get all connected integrations
router.get('/', auth, async (req, res) => {
  try {
    const integrations = await Integration.findAll({
      where: { userId: req.user.id }
    });
    res.json(integrations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// YouTube OAuth - Iniciar fluxo de autenticação
router.get('/youtube/auth', auth, async (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
      'https://www.googleapis.com/auth/yt-analytics-monetary.readonly' // Para acessar receitas do AdSense
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: req.user.id.toString(), // Para identificar o usuário no callback
      prompt: 'consent' // Força mostrar tela de consentimento para obter refresh_token
    });

    console.log('[YouTube OAuth] URL de autenticação gerada para usuário:', req.user.id);
    res.json({ authUrl });

  } catch (error) {
    console.error('[YouTube OAuth] Erro ao gerar URL:', error);
    res.status(500).json({ message: 'Erro ao iniciar autenticação' });
  }
});

// YouTube OAuth - Callback
router.get('/youtube/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send('Código ou estado ausente');
  }

  try {
    const userId = parseInt(state);
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    // Trocar código por tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('[YouTube OAuth] Tokens obtidos para usuário:', userId);

    // Verificar se já existe integração
    let integration = await Integration.findOne({
      where: { userId, provider: 'YouTube' }
    });

    if (integration) {
      // Atualizar tokens
      integration.oauthAccessToken = tokens.access_token;
      integration.oauthRefreshToken = tokens.refresh_token || integration.oauthRefreshToken;
      integration.oauthTokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
      integration.status = 'active';
      await integration.save();
      console.log('[YouTube OAuth] Integração atualizada');
    } else {
      // Criar nova integração
      integration = await Integration.create({
        userId,
        provider: 'YouTube',
        oauthAccessToken: tokens.access_token,
        oauthRefreshToken: tokens.refresh_token,
        oauthTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        status: 'active'
      });
      console.log('[YouTube OAuth] Nova integração criada');
    }

    // Redirecionar de volta para a página de integrações
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.luminiiadigital.com.br';
    res.redirect(`${frontendUrl}/integrations?youtube=success`);

  } catch (error) {
    console.error('[YouTube OAuth] Erro no callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.luminiiadigital.com.br';
    res.redirect(`${frontendUrl}/integrations?youtube=error`);
  }
});

// Connect a new integration
router.post('/connect', auth, async (req, res) => {
  const { provider, apiKey } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    const currentIntegrations = await Integration.count({ where: { userId: req.user.id } });

    // Limit Logic: Free users max 0 integrations (Paid feature only)
    if (user.plan === 'free') {
      return res.status(403).json({ 
        message: 'Integrations are a PRO feature. Upgrade to connect your accounts.' 
      });
    }

    // Check if already connected
    const existing = await Integration.findOne({
      where: { userId: req.user.id, provider }
    });

    if (existing) {
      return res.status(400).json({ message: 'Integration already connected' });
    }

    // Create connection
    const newIntegration = await Integration.create({
      userId: req.user.id,
      provider,
      apiKey: apiKey || null,
      status: 'active'
    });

    res.json(newIntegration);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Disconnect
router.delete('/:id', auth, async (req, res) => {
  try {
    const integration = await Integration.findByPk(req.params.id);

    if (!integration) {
      return res.status(404).json({ msg: 'Integration not found' });
    }

    if (integration.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await integration.destroy();
    res.json({ msg: 'Disconnected successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Sync/Import transactions from a provider
router.post('/sync', auth, async (req, res) => {
  const { provider } = req.body;

  console.log(`\n🔄 [SYNC START] Provider: ${provider}, User: ${req.user.id}`);

  try {
    // Check if connected
    const integration = await Integration.findOne({
      where: { userId: req.user.id, provider }
    });

    if (!integration) {
      console.log(`❌ [SYNC] Provider ${provider} not connected for user ${req.user.id}`);
      return res.status(400).json({ message: 'Provider not connected' });
    }

    console.log(`✅ [SYNC] Integration found:`, integration.toJSON());

    let newTransactions = [];
    
    // Service Layer Integration
    if (provider === 'Nubank') {
        const bankData = await BankingService.fetchTransactions('Nubank');
        newTransactions = bankData.map(t => ({
            description: t.description,
            amount: Math.abs(t.amount),
            type: t.type,
            source: 'Nubank',
            date: t.date
        }));
    } else if (provider === 'Open Finance') {
        const pluggyData = await PluggyService.fetchTransactions();
        newTransactions = pluggyData.map(t => ({
            description: t.description,
            amount: Math.abs(t.amount),
            type: t.type,
            source: 'Open Finance',
            date: t.date
        }));
    // } else if (provider === 'Stripe') {
    //     // REMOVIDO: Stripe apenas para pagamentos, não integrações
    //     const stripeData = await StripeService.fetchRecentPayments(integration.apiKey);
    //     newTransactions = stripeData;
    } else if (provider === 'YouTube') {
        // Preparar tokens OAuth
        const tokens = {
          access_token: integration.oauthAccessToken,
          refresh_token: integration.oauthRefreshToken,
          expiry_date: integration.oauthTokenExpiry ? new Date(integration.oauthTokenExpiry).getTime() : null
        };
        
        const ytData = await YouTubeService.getChannelRevenue(tokens);
        newTransactions = ytData.transactions || [];
    } else if (provider === 'Hotmart') {
        const hotmartData = await HotmartService.fetchSales(integration.apiKey);
        newTransactions = hotmartData;
    }

    console.log(`[Sync] Found ${newTransactions.length} transactions from ${provider}:`, newTransactions);

    // Insert into DB
    const createdTransactions = await Promise.all(newTransactions.map(t => {
      // Filter out fields that are not in the Transaction model to avoid Sequelize errors
      const { method, category, provider: _provider, external_id, ...transactionData } = t;
      
      console.log(`[Sync] Creating transaction:`, transactionData);
      
      return Transaction.create({
        ...transactionData,
        userId: req.user.id
      });
    }));

    res.json({ 
      message: `Successfully synced ${createdTransactions.length} transactions from ${provider}`,
      transactions: createdTransactions 
    });

  } catch (err) {
    console.error('[Sync Error] Full Trace:', err);
    console.error('[Sync Error] Message:', err.message);
    res.status(500).json({ 
        message: 'Server Error during sync',
        error: err.message 
    });
  }
});

// ============================================================================
// HOTMART - OAuth & Sincronização
// ============================================================================

// Hotmart OAuth - Iniciar fluxo de autenticação (DESABILITADO - USE WEBHOOK)
router.get('/hotmart/auth', auth, async (req, res) => {
  try {
    const authUrl = HotmartService.getAuthUrl(req.user.id);
    
    if (!authUrl) {
      // OAuth não configurado - orientar para usar webhook
      return res.status(200).json({ 
        useWebhook: true,
        webhookUrl: `${process.env.FRONTEND_URL || 'https://lumini-i-a.fly.dev'}/api/webhooks/hotmart`,
        message: 'Use webhook para integração simplificada' 
      });
    }
    
    console.log('[Hotmart OAuth] URL de autenticação gerada para usuário:', req.user.id);
    res.json({ authUrl });
  } catch (error) {
    console.error('[Hotmart OAuth] Erro ao gerar URL:', error);
    res.status(500).json({ message: error.message || 'Erro ao iniciar autenticação Hotmart' });
  }
});

// Hotmart OAuth - Callback
router.get('/hotmart/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send('Código ou estado ausente');
  }

  try {
    const userId = parseInt(state);
    
    // Trocar código por tokens
    const tokens = await HotmartService.exchangeCodeForTokens(code);
    
    console.log('[Hotmart OAuth] Tokens obtidos para usuário:', userId);

    // Verificar se já existe integração
    let integration = await Integration.findOne({
      where: { userId, provider: 'Hotmart' }
    });

    if (integration) {
      // Atualizar tokens
      integration.oauthAccessToken = tokens.access_token;
      integration.oauthRefreshToken = tokens.refresh_token;
      integration.oauthTokenExpiry = new Date(tokens.expiry_date);
      integration.status = 'active';
      await integration.save();
      console.log('[Hotmart OAuth] Integração atualizada');
    } else {
      // Criar nova integração
      integration = await Integration.create({
        userId,
        provider: 'Hotmart',
        oauthAccessToken: tokens.access_token,
        oauthRefreshToken: tokens.refresh_token,
        oauthTokenExpiry: new Date(tokens.expiry_date),
        status: 'active'
      });
      console.log('[Hotmart OAuth] Nova integração criada');
    }

    // Redirecionar de volta para a página de integrações
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.luminiiadigital.com.br';
    res.redirect(`${frontendUrl}/integrations?hotmart=success`);

  } catch (error) {
    console.error('[Hotmart OAuth] Erro no callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.luminiiadigital.com.br';
    res.redirect(`${frontendUrl}/integrations?hotmart=error`);
  }
});

// Hotmart - Sincronizar vendas e comissões
router.post('/hotmart/sync', auth, async (req, res) => {
  try {
    const integration = await Integration.findOne({
      where: { userId: req.user.id, provider: 'Hotmart' }
    });

    if (!integration) {
      return res.status(400).json({ message: 'Hotmart não conectado' });
    }

    console.log('[Hotmart Sync] Iniciando sincronização para usuário:', req.user.id);

    // Preparar tokens OAuth
    const tokens = {
      access_token: integration.oauthAccessToken,
      refresh_token: integration.oauthRefreshToken,
      expiry_date: integration.oauthTokenExpiry ? new Date(integration.oauthTokenExpiry).getTime() : null
    };

    // Buscar vendas
    const sales = await HotmartService.fetchSales(tokens);
    
    // Buscar comissões de afiliado (apenas em modo real)
    let commissions = [];
    if (process.env.HOTMART_USE_SANDBOX !== 'true' && tokens.access_token) {
      try {
        commissions = await HotmartService.fetchAffiliateCommissions(tokens);
      } catch (err) {
        console.log('[Hotmart Sync] Erro ao buscar comissões (continuando):', err.message);
      }
    }

    const allTransactions = [...sales, ...commissions];

    console.log(`[Hotmart Sync] Encontradas ${allTransactions.length} transações (${sales.length} vendas + ${commissions.length} comissões)`);

    // Inserir no banco de dados
    const createdTransactions = await Promise.all(
      allTransactions.map(t => {
        const { method, category, provider, ...transactionData } = t;
        return Transaction.create({
          ...transactionData,
          userId: req.user.id
        });
      })
    );

    res.json({
      message: `${createdTransactions.length} transações sincronizadas do Hotmart`,
      transactions: createdTransactions
    });

  } catch (error) {
    console.error('[Hotmart Sync] Erro:', error);
    res.status(500).json({ 
      message: 'Erro ao sincronizar Hotmart',
      error: error.message 
    });
  }
});

// ============================================================================
// OPEN FINANCE - Integração com Bancos
// ============================================================================

// Open Finance - Gerar token de conexão
router.get('/openfinance/connect-token', auth, async (req, res) => {
  try {
    const connectToken = await OpenFinanceService.generateConnectToken(req.user.id);
    res.json({ connectToken });
  } catch (error) {
    console.error('[Open Finance] Erro ao gerar token:', error);
    // Retornar a mensagem de erro original do serviço para ajudar no debug
    res.status(500).json({ 
      message: error.message || 'Erro ao gerar token de conexão',
      details: error.response?.data || null
    });
  }
});

// Open Finance - Listar bancos disponíveis
router.get('/openfinance/banks', auth, async (req, res) => {
  try {
    const banks = await OpenFinanceService.getAvailableConnectors();
    res.json({ banks });
  } catch (error) {
    console.error('[Open Finance] Erro ao listar bancos:', error);
    res.status(500).json({ message: 'Erro ao listar bancos' });
  }
});

// Open Finance - Salvar conexão bem-sucedida
router.post('/openfinance/save-connection', auth, async (req, res) => {
  const { itemId, accountId } = req.body;

  if (!itemId || !accountId) {
    return res.status(400).json({ message: 'itemId e accountId são obrigatórios' });
  }

  try {
    // Verificar se já existe integração
    let integration = await Integration.findOne({
      where: { userId: req.user.id, provider: 'Open Finance' }
    });

    if (integration) {
      // Atualizar com novos IDs
      integration.apiKey = JSON.stringify({ itemId, accountId });
      integration.status = 'active';
      await integration.save();
    } else {
      // Criar nova integração
      integration = await Integration.create({
        userId: req.user.id,
        provider: 'Open Finance',
        apiKey: JSON.stringify({ itemId, accountId }),
        status: 'active'
      });
    }

    console.log('[Open Finance] Conexão salva para usuário:', req.user.id);
    res.json({ message: 'Conexão estabelecida com sucesso', integration });

  } catch (error) {
    console.error('[Open Finance] Erro ao salvar conexão:', error);
    res.status(500).json({ message: 'Erro ao salvar conexão' });
  }
});

// Open Finance - Sincronizar transações bancárias
router.post('/openfinance/sync', auth, async (req, res) => {
  try {
    const integration = await Integration.findOne({
      where: { userId: req.user.id, provider: 'Open Finance' }
    });

    if (!integration) {
      return res.status(400).json({ message: 'Open Finance não conectado' });
    }

    console.log('[Open Finance Sync] Iniciando sincronização para usuário:', req.user.id);

    // Extrair itemId e accountId
    const { itemId, accountId } = JSON.parse(integration.apiKey || '{}');
    
    if (!accountId) {
      return res.status(400).json({ message: 'Conta bancária não configurada' });
    }

    // Gerar API key para requisições
    const apiKey = await OpenFinanceService.generateConnectToken();

    // Buscar transações
    const transactions = await OpenFinanceService.fetchTransactions(accountId, apiKey);

    console.log(`[Open Finance Sync] Encontradas ${transactions.length} transações`);

    // Inserir no banco de dados
    const createdTransactions = await Promise.all(
      transactions.map(t => {
        const { method, category, provider, ...transactionData } = t;
        return Transaction.create({
          ...transactionData,
          userId: req.user.id
        });
      })
    );

    // Buscar saldo atualizado
    let balanceInfo = null;
    try {
      balanceInfo = await OpenFinanceService.getBalance(accountId, apiKey);
    } catch (err) {
      console.log('[Open Finance Sync] Erro ao buscar saldo (continuando):', err.message);
    }

    res.json({
      message: `${createdTransactions.length} transações sincronizadas do Open Finance`,
      transactions: createdTransactions,
      balance: balanceInfo
    });

  } catch (error) {
    console.error('[Open Finance Sync] Erro:', error);
    res.status(500).json({ 
      message: 'Erro ao sincronizar Open Finance',
      error: error.message 
    });
  }
});

// Open Finance - Buscar saldo das contas
router.get('/openfinance/balance', auth, async (req, res) => {
  try {
    const integration = await Integration.findOne({
      where: { userId: req.user.id, provider: 'Open Finance' }
    });

    if (!integration) {
      return res.status(404).json({ message: 'Open Finance não conectado' });
    }

    const { accountId } = JSON.parse(integration.apiKey || '{}');
    
    if (!accountId) {
      return res.status(400).json({ message: 'Conta não configurada' });
    }

    const apiKey = await OpenFinanceService.generateConnectToken();
    const balance = await OpenFinanceService.getBalance(accountId, apiKey);

    res.json({ balance });

  } catch (error) {
    console.error('[Open Finance] Erro ao buscar saldo:', error);
    res.status(500).json({ message: 'Erro ao buscar saldo' });
  }
});

// Open Finance - Buscar investimentos
router.get('/openfinance/investments', auth, async (req, res) => {
  try {
    const integration = await Integration.findOne({
      where: { userId: req.user.id, provider: 'Open Finance' }
    });

    if (!integration) {
      return res.status(404).json({ message: 'Open Finance não conectado' });
    }

    const { itemId } = JSON.parse(integration.apiKey || '{}');
    
    if (!itemId) {
      return res.status(400).json({ message: 'Conexão não configurada' });
    }

    const apiKey = await OpenFinanceService.generateConnectToken();
    const investments = await OpenFinanceService.getInvestments(itemId, apiKey);

    res.json({ investments });

  } catch (error) {
    console.error('[Open Finance] Erro ao buscar investimentos:', error);
    res.status(500).json({ message: 'Erro ao buscar investimentos' });
  }
});

module.exports = router;
