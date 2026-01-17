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
      'https://www.googleapis.com/auth/yt-analytics.readonly'
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
    res.redirect('/integrations?youtube=success');

  } catch (error) {
    console.error('[YouTube OAuth] Erro no callback:', error);
    res.redirect('/integrations?youtube=error');
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

module.exports = router;
