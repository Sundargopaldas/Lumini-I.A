const express = require('express');
const router = express.Router();
const Accountant = require('../models/Accountant');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const Document = require('../models/Document');
const { Op } = require('sequelize');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const EmailService = require('../services/EmailService');
const EmailValidator = require('../utils/emailValidator');

// Configure Multer for Image Upload (Accountant Profiles)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/accountants';
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'accountant-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

// Configure Multer for Document Upload (Client Documents)
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, 'doc-' + uniqueSuffix + '-' + sanitizedFilename);
  }
});

const uploadDocument = multer({ 
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Aceitar documentos e imagens
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Apenas PDF, Word, Excel, TXT e imagens.'));
    }
  }
});




// POST /api/accountants/invite - Invite/Link an accountant
router.post('/invite', authMiddleware, async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Validate email existence
        const emailValidation = await EmailValidator.validate(email);
        if (!emailValidation.valid) {
            console.log(`❌ [POST /accountants/invite] Email inválido: ${email} - Razão: ${emailValidation.reason}`);
            return res.status(400).json({ 
                message: emailValidation.reason
            });
        }

        // Fetch full user data to ensure we have name/email for the email template
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 1. Check if accountant exists
        const accountant = await Accountant.findOne({ where: { email } });

        if (accountant) {
            // Link user to accountant
            await User.update({ accountantId: accountant.id }, { where: { id: req.user.id } });

            // Send notification to the accountant
            let emailSent = false;
            let emailError = null;
            try {
                await EmailService.sendNewClientNotification(user, email);
                console.log(`✅ New client notification sent to accountant: ${email}`);
                emailSent = true;
            } catch (emailErr) {
                console.error('⚠️  Failed to send new client notification:', emailErr);
                emailError = emailErr.message;
                // Continue even if email fails (user is already linked)
            }

            return res.json({ 
                status: 'linked', 
                message: emailSent 
                    ? `✅ Contador vinculado com sucesso! Uma notificação foi enviada para ${email}.`
                    : `⚠️  Contador vinculado, mas não foi possível enviar email de notificação: ${emailError}`,
                emailSent
            });
        }

        // 2. If not found, send invite email
        try {
            await EmailService.sendInviteEmail(user, email);
            return res.json({ 
                status: 'invited', 
                message: `✅ Convite enviado com sucesso para ${email}! Verifique sua caixa de entrada e spam.` 
            });
        } catch (emailErr) {
            console.error('Failed to send invite email:', emailErr);
            return res.status(500).json({ 
                message: `Erro ao enviar email: ${emailErr.message}. Verifique a configuração SMTP em Admin → Configurações do Sistema.` 
            });
        }

    } catch (error) {
        console.error('Invite error:', error);
        res.status(500).json({ message: 'Error processing invite' });
    }
});

// POST /api/accountants/link-client - Vincular cliente ao contador (TEMPORÁRIO - DEBUG)
router.post('/link-client', authMiddleware, async (req, res) => {
  try {
    const { accountantEmail } = req.body;
    
    console.log('🔗 [LINK-CLIENT] User ID:', req.user.id);
    console.log('🔗 [LINK-CLIENT] Accountant Email:', accountantEmail);
    
    // Buscar contador pelo email
    const accountant = await Accountant.findOne({ where: { email: accountantEmail } });
    
    if (!accountant) {
      return res.status(404).json({ message: 'Contador não encontrado com esse email' });
    }
    
    console.log('🔗 [LINK-CLIENT] Accountant found:', accountant.id);
    
    // Vincular cliente ao contador
    await User.update({ accountantId: accountant.id }, { where: { id: req.user.id } });
    
    console.log('✅ [LINK-CLIENT] Cliente vinculado com sucesso!');
    
    res.json({ 
      message: 'Cliente vinculado ao contador com sucesso!',
      accountantId: accountant.id,
      accountantName: accountant.businessName || accountant.name
    });
  } catch (error) {
    console.error('❌ [LINK-CLIENT] Error:', error);
    res.status(500).json({ message: 'Erro ao vincular cliente' });
  }
});

// GET /api/accountants/my-accountant - Get accountant profile of the logged-in client
router.get('/my-accountant', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 [MY-ACCOUNTANT] User ID:', req.user.id);
    
    // Buscar o usuário e seu contador vinculado
    const user = await User.findByPk(req.user.id);
    
    console.log('🔍 [MY-ACCOUNTANT] User found:', !!user);
    console.log('🔍 [MY-ACCOUNTANT] User accountantId:', user?.accountantId);
    
    if (!user || !user.accountantId) {
      console.log('⚠️ [MY-ACCOUNTANT] Nenhum contador vinculado');
      return res.status(404).json({ message: 'Nenhum contador vinculado' });
    }
    
    // Buscar o perfil do contador
    const accountantProfile = await Accountant.findByPk(user.accountantId);
    
    console.log('🔍 [MY-ACCOUNTANT] Accountant profile found:', !!accountantProfile);
    
    if (!accountantProfile) {
      console.log('❌ [MY-ACCOUNTANT] Contador não encontrado');
      return res.status(404).json({ message: 'Contador não encontrado' });
    }
    
    // Buscar o usuário do contador para pegar a logo
    const accountantUser = await User.findByPk(accountantProfile.userId);
    const logoUrl = accountantProfile.logo || (accountantUser?.logo ? `/uploads/logos/${accountantUser.logo}` : null);
    
    console.log('✅ [MY-ACCOUNTANT] Logo URL:', logoUrl);
    console.log('✅ [MY-ACCOUNTANT] Business Name:', accountantProfile.businessName);
    
    res.json({
      id: accountantProfile.id,
      name: accountantProfile.name,
      businessName: accountantProfile.businessName,
      email: accountantProfile.email,
      phone: accountantProfile.phone,
      logo: logoUrl,
      website: accountantProfile.website
    });
  } catch (error) {
    console.error('❌ [MY-ACCOUNTANT] Error:', error);
    res.status(500).json({ message: 'Erro ao buscar contador' });
  }
});

// GET /api/accountants/dashboard/stats - Dashboard agregado do contador
router.get('/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    // Verificar se é contador
    const accountantProfile = await Accountant.findOne({ where: { userId: req.user.id } });
    if (!accountantProfile) {
      return res.status(403).json({ message: 'Perfil de contador não encontrado.' });
    }

    // Buscar todos os clientes
    const clients = await User.findAll({
      where: { accountantId: accountantProfile.id },
      attributes: ['id', 'name', 'email', 'plan', 'createdAt']
    });

    const clientIds = clients.map(c => c.id);

    // Buscar todas as transações dos clientes (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await Transaction.findAll({
      where: {
        userId: { [Op.in]: clientIds },
        date: { [Op.gte]: thirtyDaysAgo }
      }
    });

    // Buscar notas fiscais pendentes
    const Invoice = require('../models/Invoice');
    const pendingInvoices = await Invoice.findAll({
      where: {
        userId: { [Op.in]: clientIds },
        status: 'processing'
      },
      include: [{
        model: User,
        attributes: ['name', 'email']
      }]
    });

    // Calcular estatísticas
    const totalRevenue = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

    // Clientes por plano
    const clientsByPlan = clients.reduce((acc, c) => {
      acc[c.plan] = (acc[c.plan] || 0) + 1;
      return acc;
    }, {});

    // Atividade recente (últimos 7 dias)
    const last7Days = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      last7Days[dateKey] = { income: 0, expense: 0, count: 0 };
    }

    transactions.forEach(t => {
      const dateKey = t.date.substring(0, 10);
      if (last7Days[dateKey]) {
        const amount = parseFloat(t.amount || 0);
        if (t.type === 'income') {
          last7Days[dateKey].income += amount;
        } else {
          last7Days[dateKey].expense += amount;
        }
        last7Days[dateKey].count += 1;
      }
    });

    // Alertas/Pendências
    const alerts = pendingInvoices.map(inv => ({
      type: 'invoice_pending',
      message: `Nota fiscal #${inv.id} aguardando processamento`,
      clientName: inv.User?.name || 'Cliente',
      clientId: inv.userId,
      priority: 'medium',
      date: inv.createdAt
    }));

    // Buscar logo do usuário se não tiver no perfil do contador
    const userProfile = await User.findByPk(req.user.id);
    
    console.log('🔍 [DASHBOARD-STATS] accountantProfile.logo:', accountantProfile.logo);
    console.log('🔍 [DASHBOARD-STATS] userProfile.logo:', userProfile?.logo);
    
    const logoUrl = accountantProfile.logo || (userProfile?.logo ? `/uploads/logos/${userProfile.logo}` : null);
    
    console.log('✅ [DASHBOARD-STATS] logoUrl final:', logoUrl);
    console.log('✅ [DASHBOARD-STATS] businessName:', accountantProfile.businessName);
    console.log('✅ [DASHBOARD-STATS] name:', accountantProfile.name);

    res.json({
      accountantProfile: {
        id: accountantProfile.id,
        name: accountantProfile.name,
        businessName: accountantProfile.businessName,
        email: accountantProfile.email,
        phone: accountantProfile.phone,
        logo: logoUrl,
        website: accountantProfile.website
      },
      overview: {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.plan !== 'free').length,
        totalRevenue: totalRevenue.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        netIncome: (totalRevenue - totalExpenses).toFixed(2)
      },
      clientsByPlan,
      recentActivity: last7Days,
      alerts,
      topClients: clients.slice(0, 5) // Top 5 clientes mais recentes
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Erro ao carregar estatísticas' });
  }
});

// GET /api/accountants/me/clients - List clients for the logged-in accountant
router.get('/me/clients', authMiddleware, async (req, res) => {
  try {
    // 1. Find the accountant profile associated with the logged-in user
    const accountant = await Accountant.findOne({ where: { userId: req.user.id } });
    
    if (!accountant) {
      return res.status(404).json({ message: 'Accountant profile not found for this user.' });
    }

    // 2. Find all users linked to this accountant
    const clients = await User.findAll({
      where: { accountantId: accountant.id },
      attributes: ['id', 'username', 'email', 'name', 'plan', 'createdAt'], // Exclude password
      include: [
        {
           model: Transaction,
           attributes: ['amount', 'type', 'date'],
           limit: 1,
           order: [['date', 'DESC']] // Just to get last activity
        }
      ]
    });

    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Error loading clients' });
  }
});

// GET /api/accountants/client/:clientId/report - Get detailed financial report for a client
router.get('/client/:clientId/report', authMiddleware, async (req, res) => {
    try {
        const { clientId } = req.params;
        
        // 1. Verify if the accountant owns this client
        const accountant = await Accountant.findOne({ where: { userId: req.user.id } });
        if (!accountant) {
            return res.status(403).json({ message: 'Access denied. You are not an accountant.' });
        }

        const client = await User.findOne({ 
            where: { 
                id: clientId,
                accountantId: accountant.id 
            },
            attributes: ['id', 'username', 'email', 'name', 'cpfCnpj', 'address']
        });

        if (!client) {
            return res.status(404).json({ message: 'Client not found or not assigned to you.' });
        }

        // 2. Fetch Financial Data (Last 12 months)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);

        const transactions = await Transaction.findAll({
            where: {
                userId: clientId,
                date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['date', 'ASC']]
        });

        // 3. Process Data for Accounting View
        
        // A. Income by Source (Crucial for YouTubers: Exterior vs Domestic)
        const incomeBySource = {
            total: 0,
            sources: {}
        };
        
        // B. Expenses by Category (Deductibles)
        const expensesByCategory = {
            total: 0,
            categories: {}
        };

        // C. Monthly Cashflow
        const monthlyFlow = {};

        transactions.forEach(t => {
            const amount = parseFloat(t.amount);
            const monthKey = t.date.substring(0, 7); // YYYY-MM

            // Init monthly
            if (!monthlyFlow[monthKey]) monthlyFlow[monthKey] = { income: 0, expense: 0 };

            if (t.type === 'income') {
                incomeBySource.total += amount;
                const source = t.source || 'Outros';
                incomeBySource.sources[source] = (incomeBySource.sources[source] || 0) + amount;
                monthlyFlow[monthKey].income += amount;
            } else {
                expensesByCategory.total += Math.abs(amount);
                // We need to fetch category name, but for optimization we might group by description or handle include above
                // For now let's use a simple grouping if category is not populated
                const catName = 'Geral'; // In a real scenario we would include Category model
                expensesByCategory.categories[catName] = (expensesByCategory.categories[catName] || 0) + Math.abs(amount);
                monthlyFlow[monthKey].expense += Math.abs(amount);
            }
        });

        // 4. Tax Estimation (Simples Nacional Simulation)
        // Creator Economy specifics:
        // Anexo III: ~6% (if Fator R >= 28%)
        // Anexo V: ~15.5% (if Fator R < 28%)
        // Isenção: Exportação de Serviços (AdSense/YouTube often counts as export to Google US/Ireland)
        
        const adSenseIncome = incomeBySource.sources['YouTube'] || incomeBySource.sources['AdSense'] || 0;
        const localIncome = incomeBySource.total - adSenseIncome;
        
        // Simplified Simulation
        const taxSim = {
            regime: 'Simples Nacional',
            anexoSuggested: 'Anexo III (Sujeito ao Fator R)',
            estimatedTax: (localIncome * 0.06) + (adSenseIncome * 0), // Assuming exemption for export (simplified)
            exportExemptionSavings: adSenseIncome * 0.06, // How much they saved by export exemption
            obs: 'Cálculo estimativo. Receitas do YouTube/AdSense podem ser isentas de PIS/COFINS e ISS se configuradas como exportação de serviços.'
        };

        res.json({
            client,
            period: { start: startDate, end: endDate },
            financials: {
                incomeBySource,
                expensesByCategory,
                monthlyFlow,
                taxSim
            }
        });

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
});

// GET /api/accountants - List verified accountants (Public)
router.get('/', async (req, res) => {
  try {
    const accountants = await Accountant.findAll({
      where: { verified: true },
      order: [['createdAt', 'DESC']]
    });
    
    // Add full URL to image
    const accountantsWithUrl = accountants.map(acc => {
      const accJson = acc.toJSON();
      if (accJson.image) {
        accJson.image = `${req.protocol}://${req.get('host')}/${accJson.image}`;
      }
      return accJson;
    });

    res.json(accountantsWithUrl);
  } catch (error) {
    console.error('Error fetching accountants:', error);
    res.status(500).json({ message: 'Error loading accountants' });
  }
});

// GET /api/accountants/admin - List ALL accountants (Admin only)
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin (simplified check, you might want a role field)
    // For now, assuming any authenticated user can see (FIXME: Add role check)
    
    const accountants = await Accountant.findAll({
      order: [['createdAt', 'DESC']]
    });

    // Add full URL to image (same as public route)
    const accountantsWithUrl = accountants.map(acc => {
      const accJson = acc.toJSON();
      if (accJson.image) {
        accJson.image = `${req.protocol}://${req.get('host')}/${accJson.image}`;
      }
      return accJson;
    });

    res.json(accountantsWithUrl);
  } catch (error) {
    console.error('Error fetching admin accountants:', error);
    res.status(500).json({ message: 'Error loading accountants' });
  }
});

// POST /api/accountants - Register a new accountant
router.post('/', authMiddleware, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Imagem muito grande! Tamanho máximo: 10MB' });
      }
      return res.status(400).json({ message: err.message || 'Erro no upload da imagem' });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('📝 [POST /accountants] Dados recebidos:', req.body);
    console.log('👤 [POST /accountants] User ID:', req.user?.id);
    console.log('📷 [POST /accountants] Arquivo:', req.file ? req.file.filename : 'Sem imagem');

    const { name, email, phone, specialty, description, tags, crc } = req.body;
    const userId = req.user.id; // From authMiddleware

    // Validate email existence
    const emailValidation = await EmailValidator.validate(email);
    if (!emailValidation.valid) {
      console.log(`❌ [POST /accountants] Email inválido: ${email} - Razão: ${emailValidation.reason}`);
      return res.status(400).json({ 
        message: emailValidation.reason
      });
    }

    // Server-side CRC Validation
    // Regex for CRC: UF-000000/T-D (Example: SP-123456/O-8, RJ-654321/P-5)
    // Aceita formato com ou sem dígito verificador: UF-000000/T ou UF-000000/T-D
    const crcRegex = /^[A-Z]{2}-\d{6}\/[A-Z](-\d)?$/;
    const crcToValidate = crc ? crc.trim().toUpperCase() : '';
    if (crcToValidate && !crcRegex.test(crcToValidate)) {
        console.log('❌ [POST /accountants] CRC inválido:', crcToValidate);
        return res.status(400).json({ message: 'Formato de CRC inválido. Use o formato UF-000000/T-D (ex: SP-123456/O-8 ou RJ-654321/P-5)' });
    }

    // Check if user already has an accountant profile
    console.log('🔍 [POST /accountants] Verificando se usuário já tem perfil...');
    const existingAccountant = await Accountant.findOne({ where: { userId } });
    if (existingAccountant) {
        console.log('⚠️ [POST /accountants] Usuário já possui perfil de contador');
        return res.status(400).json({ message: 'Você já possui um perfil de contador cadastrado.' });
    }

    // Check if CRC is already in use
    if (crcToValidate) {
        console.log('🔍 [POST /accountants] Verificando se CRC já existe...');
        const existingCRC = await Accountant.findOne({ where: { crc: crcToValidate } });
        if (existingCRC) {
             console.log('⚠️ [POST /accountants] CRC já em uso:', crcToValidate);
             return res.status(400).json({ message: 'Este CRC já está em uso por outro contador.' });
        }
    }

    console.log('💾 [POST /accountants] Criando contador...');
    const newAccountant = await Accountant.create({
      name,
      email,
      phone,
      specialty,
      description,
      tags,
      crc: crcToValidate || crc, // Use o valor formatado (uppercase e trimmed)
      userId,
      image: req.file ? req.file.path.replace(/\\/g, '/') : null,
      verified: true // Auto-aprovado - Admin pode remover depois se fraudulento
    });

    console.log('✅ [POST /accountants] Contador criado com sucesso! ID:', newAccountant.id);
    res.status(201).json(newAccountant);
  } catch (error) {
    console.error('❌ [POST /accountants] Erro completo:', error);
    console.error('Stack trace:', error.stack);
    if (error.name === 'SequelizeValidationError') {
        console.error('Validation errors:', error.errors);
        return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Error registering accountant', error: error.message });
  }
});

// PUT /api/accountants/:id/verify - Verify an accountant (Admin only)
router.put('/:id/verify', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const accountant = await Accountant.findByPk(id);

    if (!accountant) {
      return res.status(404).json({ message: 'Accountant not found' });
    }

    accountant.verified = true;
    await accountant.save();

    res.json({ message: 'Accountant verified successfully', accountant });
  } catch (error) {
    console.error('Error verifying accountant:', error);
    res.status(500).json({ message: 'Error verifying accountant' });
  }
});

// PUT /api/accountants/:id/unverify - Unverify an accountant (Admin only)
router.put('/:id/unverify', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const accountant = await Accountant.findByPk(id);

    if (!accountant) {
      return res.status(404).json({ message: 'Accountant not found' });
    }

    accountant.verified = false;
    await accountant.save();

    res.json({ message: 'Accountant hidden from marketplace', accountant });
  } catch (error) {
    console.error('Error unverifying accountant:', error);
    res.status(500).json({ message: 'Error unverifying accountant' });
  }
});

// DELETE /api/accountants/:id - Delete an accountant (Admin or own profile)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const accountant = await Accountant.findByPk(id);

    if (!accountant) {
      return res.status(404).json({ message: 'Accountant not found' });
    }

    // Check if user is admin or owns this accountant profile
    const user = await User.findByPk(req.user.id);
    const isAdmin = user.isAdmin;
    const ownsProfile = accountant.userId === req.user.id;

    if (!isAdmin && !ownsProfile) {
      return res.status(403).json({ message: 'You do not have permission to delete this accountant profile' });
    }

    // Delete image file if exists
    if (accountant.image) {
      const imagePath = path.resolve(accountant.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Unlink all users associated with this accountant
    await User.update({ accountantId: null }, {
      where: { accountantId: id }
    });

    // Update the user's isAccountant flag
    if (ownsProfile) {
      await User.update({ isAccountant: false }, {
        where: { id: req.user.id }
      });
    }

    await accountant.destroy();

    res.json({ message: 'Accountant deleted successfully' });
  } catch (error) {
    console.error('Error deleting accountant:', error);
    res.status(500).json({ message: 'Error deleting accountant' });
  }
});

// POST /api/accountants/link - Link current user to an accountant
router.post('/link', authMiddleware, async (req, res) => {
    try {
        const { accountantId } = req.body;
        const userId = req.user.id;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const accountant = await Accountant.findByPk(accountantId);
        if (!accountant) {
            return res.status(404).json({ message: 'Accountant not found' });
        }

        user.accountantId = accountantId;
        await user.save();

        // Criar notificação para o contador
        try {
          console.log('🔔 [NOTIFICATION] Criando notificação de novo cliente...');
          console.log('📊 Dados:', { 
            accountantId: accountant.id, 
            userId: user.id, 
            userName: user.name || user.username 
          });
          
          const notification = await Notification.create({
            accountantId: accountant.id,
            userId: user.id,
            type: 'new_client',
            title: '🎉 Novo Cliente Vinculado',
            message: `${user.name || user.username} acabou de se vincular como seu cliente!`,
            metadata: {
              clientId: user.id,
              clientName: user.name || user.username,
              clientEmail: user.email
            }
          });
          
          console.log('✅ [NOTIFICATION] Notificação criada com sucesso! ID:', notification.id);
        } catch (notifError) {
          console.error('❌ [NOTIFICATION] Erro ao criar notificação:', notifError);
          console.error('Stack:', notifError.stack);
          // Não falhar a operação principal por causa da notificação
        }

        res.json({ message: 'Contador vinculado com sucesso!', accountant });
    } catch (error) {
        console.error('Error linking accountant:', error);
        res.status(500).json({ message: 'Erro ao vincular contador' });
    }
});

// POST /api/accountants/unlink - Unlink current user from their accountant
router.post('/unlink', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.accountantId) {
            return res.status(400).json({ message: 'No accountant linked' });
        }

        const previousAccountantId = user.accountantId;

        user.accountantId = null;
        await user.save();

        // Criar notificação para o contador
        try {
          console.log('🔔 [NOTIFICATION] Criando notificação de cliente desvinculado...');
          
          const notification = await Notification.create({
            accountantId: previousAccountantId,
            userId: user.id,
            type: 'client_unlinked',
            title: '⚠️ Cliente Desvinculado',
            message: `${user.name || user.username} se desvinculou do seu perfil.`,
            metadata: {
              clientId: user.id,
              clientName: user.name || user.username,
              clientEmail: user.email
            }
          });
          
          console.log('✅ [NOTIFICATION] Notificação de desvinculação criada! ID:', notification.id);
        } catch (notifError) {
          console.error('❌ [NOTIFICATION] Erro ao criar notificação:', notifError);
          // Não falhar a operação principal
        }

        res.json({ message: 'Vínculo com contador removido com sucesso!' });
    } catch (error) {
        console.error('Error unlinking accountant:', error);
        res.status(500).json({ message: 'Erro ao desvincular contador' });
    }
});

// GET /api/accountants/clients - List clients linked to the current accountant (Logged in as Accountant User)
router.get('/clients', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the Accountant profile associated with this user
        const accountantProfile = await Accountant.findOne({ where: { userId } });
        
        if (!accountantProfile) {
            return res.status(403).json({ message: 'Você não possui um perfil de contador.' });
        }

        // Find all users linked to this accountant
        const clients = await User.findAll({
            where: { accountantId: accountantProfile.id },
            attributes: ['id', 'name', 'email', 'plan', 'createdAt'] // Limit exposed data
        });

        res.json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ message: 'Erro ao buscar clientes' });
    }
});

// GET /api/accountants/clients/:clientId/report - Get financial summary for a client
router.get('/clients/:clientId/report', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { clientId } = req.params;

        // Verify Accountant Profile
        const accountantProfile = await Accountant.findOne({ where: { userId } });
        if (!accountantProfile) {
            return res.status(403).json({ message: 'Acesso negado. Perfil de contador não encontrado.' });
        }

        // Verify Link
        const client = await User.findOne({
            where: { 
                id: clientId,
                accountantId: accountantProfile.id
            }
        });

        if (!client) {
            return res.status(403).json({ message: 'Acesso negado. Este usuário não está vinculado ao seu escritório.' });
        }

        // Fetch Financial Data (Current Month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const transactions = await Transaction.findAll({
            where: {
                userId: clientId,
                date: {
                    [Op.gte]: startOfMonth
                }
            }
        });

        const revenue = transactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + Number(t.amount), 0);

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + Number(t.amount), 0);

        res.json({
            client: {
                name: client.name,
                email: client.email,
                cpfCnpj: client.cpfCnpj
            },
            period: {
                month: startOfMonth.toLocaleString('pt-BR', { month: 'long' }),
                year: startOfMonth.getFullYear()
            },
            financials: {
                revenue,
                expenses,
                netIncome: revenue - expenses,
                transactionCount: transactions.length
            }
        });

    } catch (error) {
        console.error('Error fetching client report:', error);
        res.status(500).json({ message: 'Erro ao gerar relatório do cliente' });
    }
});

// GET /api/accountants/notifications - Get notifications for accountant
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const accountant = await Accountant.findOne({ where: { userId: req.user.id } });
    
    if (!accountant) {
      return res.status(404).json({ message: 'Accountant profile not found' });
    }

    // Buscar notificações reais do banco de dados
    console.log('📊 Buscando notificações para accountant ID:', accountant.id);
    
    const notifications = await Notification.findAll({
      where: { accountantId: accountant.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    console.log(`✅ Encontradas ${notifications.length} notificações`);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error loading notifications' });
  }
});

// PATCH /api/accountants/notifications/:id/read - Mark notification as read
router.patch('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const accountant = await Accountant.findOne({ where: { userId: req.user.id } });
    
    if (!accountant) {
      return res.status(404).json({ message: 'Accountant profile not found' });
    }

    const notification = await Notification.findOne({
      where: {
        id,
        accountantId: accountant.id
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// PATCH /api/accountants/notifications/mark-all-read - Mark all notifications as read
router.patch('/notifications/mark-all-read', authMiddleware, async (req, res) => {
  try {
    const accountant = await Accountant.findOne({ where: { userId: req.user.id } });
    
    if (!accountant) {
      return res.status(404).json({ message: 'Accountant profile not found' });
    }

    await Notification.update(
      { 
        read: true, 
        readAt: new Date() 
      },
      {
        where: {
          accountantId: accountant.id,
          read: false
        }
      }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

// DELETE /api/accountants/notifications/:id - Delete notification
router.delete('/notifications/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const accountant = await Accountant.findOne({ where: { userId: req.user.id } });
    
    if (!accountant) {
      return res.status(404).json({ message: 'Accountant profile not found' });
    }

    const notification = await Notification.findOne({
      where: {
        id: id,
        accountantId: accountant.id
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.destroy();

    console.log('🗑️ Notificação deletada:', id);
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

// GET /api/accountants/documents - Get shared documents (for accountant)
router.get('/documents', authMiddleware, async (req, res) => {
  try {
    const accountant = await Accountant.findOne({ where: { userId: req.user.id } });
    
    if (!accountant) {
      return res.status(404).json({ message: 'Accountant profile not found' });
    }

    // Buscar documentos enviados por este contador
    const documents = await Document.findAll({
      where: { accountantId: accountant.id },
      include: [{
        model: User,
        as: 'client',
        attributes: ['id', 'name', 'username', 'email']
      }],
      order: [['uploadedAt', 'DESC']]
    });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Error loading documents' });
  }
});

// POST /api/accountants/documents - Upload document
router.post('/documents', authMiddleware, uploadDocument.single('document'), async (req, res) => {
  try {
    console.log('🔍 [UPLOAD DEBUG] Iniciando upload...');
    console.log('🔍 [UPLOAD DEBUG] req.body:', req.body);
    console.log('🔍 [UPLOAD DEBUG] req.file:', req.file);
    
    const { clientId, description } = req.body;
    const file = req.file;

    if (!file) {
      console.log('❌ [UPLOAD DEBUG] Nenhum arquivo recebido!');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('✅ [UPLOAD DEBUG] Arquivo recebido:', file.originalname, file.mimetype);

    const accountant = await Accountant.findOne({ where: { userId: req.user.id } });
    
    if (!accountant) {
      console.log('❌ [UPLOAD DEBUG] Contador não encontrado para userId:', req.user.id);
      return res.status(404).json({ message: 'Accountant profile not found' });
    }

    console.log('✅ [UPLOAD DEBUG] Contador encontrado:', accountant.id);
    console.log('🔍 [UPLOAD DEBUG] ClientId recebido:', clientId);

    // Verificar se o cliente pertence a este contador
    const client = await User.findOne({
      where: {
        id: clientId,
        accountantId: accountant.id
      }
    });

    if (!client) {
      console.log('❌ [UPLOAD DEBUG] Cliente não encontrado ou não pertence ao contador');
      console.log('🔍 [UPLOAD DEBUG] Buscando cliente com id:', clientId, 'accountantId:', accountant.id);
      
      // Verificar se cliente existe
      const clientExists = await User.findByPk(clientId);
      if (clientExists) {
        console.log('🔍 [UPLOAD DEBUG] Cliente existe mas accountantId é:', clientExists.accountantId);
      } else {
        console.log('🔍 [UPLOAD DEBUG] Cliente não existe no banco');
      }
      
      // Deletar arquivo se cliente não encontrado
      fs.unlinkSync(file.path);
      return res.status(403).json({ message: 'Client not found or not assigned to you' });
    }

    console.log('✅ [UPLOAD DEBUG] Cliente encontrado:', client.name);

    // Salvar documento no banco de dados
    const document = await Document.create({
      filename: file.filename,
      originalName: file.originalname,
      filepath: file.path,
      fileSize: file.size,
      fileType: file.mimetype,
      description: description || null,
      clientId: clientId,
      accountantId: accountant.id,
      uploadedAt: new Date()
    });

    console.log('✅ [UPLOAD DEBUG] Documento salvo no banco:', document.id);

    // Criar notificação para o cliente
    await Notification.create({
      accountantId: accountant.id,
      type: 'new_document',
      title: '📄 Novo Documento Recebido',
      message: `Seu contador enviou: ${file.originalname}`,
      read: false,
      userId: clientId // Notificação para o cliente
    });

    console.log('✅ [UPLOAD DEBUG] Notificação criada para cliente');
    console.log('📤 Documento enviado:', file.originalname, 'para cliente:', client.name);

    res.json({ success: true, document });
  } catch (error) {
    console.error('❌ [UPLOAD DEBUG] ERRO COMPLETO:', error);
    console.error('❌ [UPLOAD DEBUG] Stack:', error.stack);
    // Deletar arquivo se houver erro
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({ message: 'Error uploading document', error: error.message });
  }
});

// POST /api/accountants/invite-client - Invite a client via email
router.post('/invite-client', authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const accountant = await Accountant.findOne({ where: { userId: req.user.id } });
    
    if (!accountant) {
      return res.status(404).json({ message: 'Accountant profile not found' });
    }

    // Buscar usuário pelo email
    const user = await User.findOne({ where: { email } });

    if (user) {
      // Se usuário existe, vincular diretamente
      if (user.accountantId === accountant.id) {
        return res.status(400).json({ message: 'Este cliente já está vinculado a você' });
      }

      if (user.accountantId) {
        return res.status(400).json({ message: 'Este cliente já possui outro contador vinculado' });
      }

      await user.update({ accountantId: accountant.id });

      // Enviar notificação (em produção)
      
      return res.json({ 
        success: true, 
        message: 'Cliente vinculado com sucesso!' 
      });
    }

    // Se usuário não existe, enviar email de convite (em produção)
    // await EmailService.sendInviteEmail(email, accountant);

    res.json({ 
      success: true, 
      message: `Convite enviado para ${email}. O usuário poderá se cadastrar e será automaticamente vinculado a você.` 
    });

  } catch (error) {
    console.error('Error inviting client:', error);
    res.status(500).json({ message: 'Error sending invite' });
  }
});

// ============================================
// ROTAS PARA CLIENTES (Client Document Access)
// ============================================

// GET /api/accountants/my-documents - Get documents shared with logged-in client
router.get('/my-documents', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar documentos compartilhados com este usuário
    const documents = await Document.findAll({
      where: { clientId: userId },
      include: [{
        model: Accountant,
        as: 'accountant',
        attributes: ['id', 'name', 'email']
      }],
      order: [['uploadedAt', 'DESC']]
    });

    console.log(`📥 Cliente ${userId} buscou ${documents.length} documentos`);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching client documents:', error);
    res.status(500).json({ message: 'Error loading documents' });
  }
});

// DELETE /api/accountants/documents/:id - Delete document
router.delete('/documents/:id', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 [DELETE DEBUG] Iniciando deleção...');
    console.log('🔍 [DELETE DEBUG] Document ID:', req.params.id);
    console.log('🔍 [DELETE DEBUG] User ID:', req.user.id);
    
    const { id } = req.params;
    const userId = req.user.id;

    // Buscar documento
    const document = await Document.findByPk(id);

    if (!document) {
      console.log('❌ [DELETE DEBUG] Documento não encontrado:', id);
      return res.status(404).json({ message: 'Document not found' });
    }

    console.log('✅ [DELETE DEBUG] Documento encontrado:', document.originalName);

    // Verificar permissão (só o contador que enviou pode deletar)
    const accountant = await Accountant.findOne({ where: { userId } });
    
    if (!accountant || document.accountantId !== accountant.id) {
      console.log('❌ [DELETE DEBUG] Sem permissão para deletar');
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('✅ [DELETE DEBUG] Permissão OK, deletando arquivo...');

    // Deletar arquivo físico
    if (fs.existsSync(document.filepath)) {
      fs.unlinkSync(document.filepath);
      console.log('✅ [DELETE DEBUG] Arquivo físico deletado');
    } else {
      console.log('⚠️ [DELETE DEBUG] Arquivo físico não existe');
    }

    // Deletar do banco
    await document.destroy();
    console.log('✅ [DELETE DEBUG] Documento removido do banco');

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('❌ [DELETE DEBUG] Erro completo:', error);
    res.status(500).json({ message: 'Error deleting document' });
  }
});

// GET /api/accountants/documents/:id/download - Download document
router.get('/documents/:id/download', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 [DOWNLOAD DEBUG] Iniciando download...');
    console.log('🔍 [DOWNLOAD DEBUG] Document ID:', req.params.id);
    console.log('🔍 [DOWNLOAD DEBUG] User ID:', req.user.id);
    
    const { id } = req.params;
    const userId = req.user.id;

    // Buscar documento
    const document = await Document.findByPk(id);

    if (!document) {
      console.log('❌ [DOWNLOAD DEBUG] Documento não encontrado:', id);
      return res.status(404).json({ message: 'Document not found' });
    }

    console.log('✅ [DOWNLOAD DEBUG] Documento encontrado:', document.originalName);
    console.log('🔍 [DOWNLOAD DEBUG] Filepath:', document.filepath);
    console.log('🔍 [DOWNLOAD DEBUG] ClientId do documento:', document.clientId);

    // Verificar permissão (cliente pode baixar seus docs, contador pode baixar docs que enviou)
    const accountant = await Accountant.findOne({ where: { userId } });
    
    console.log('🔍 [DOWNLOAD DEBUG] Accountant:', accountant?.id || 'null');
    
    const isOwner = document.clientId === userId; // É o cliente dono
    const isSender = accountant && document.accountantId === accountant.id; // É o contador que enviou

    console.log('🔍 [DOWNLOAD DEBUG] isOwner:', isOwner);
    console.log('🔍 [DOWNLOAD DEBUG] isSender:', isSender);

    if (!isOwner && !isSender) {
      console.log('❌ [DOWNLOAD DEBUG] Acesso negado!');
      return res.status(403).json({ message: 'Access denied' });
    }

    // Verificar se arquivo existe
    if (!fs.existsSync(document.filepath)) {
      console.log('❌ [DOWNLOAD DEBUG] Arquivo não existe no servidor:', document.filepath);
      return res.status(404).json({ message: 'File not found on server' });
    }

    console.log('✅ [DOWNLOAD DEBUG] Arquivo existe, iniciando download...');
    console.log(`📥 Download: ${document.originalName} por usuário ${userId}`);

    // Enviar arquivo
    res.download(document.filepath, document.originalName, (err) => {
      if (err) {
        console.error('❌ [DOWNLOAD DEBUG] Erro no download:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error downloading file' });
        }
      } else {
        console.log('✅ [DOWNLOAD DEBUG] Download concluído com sucesso!');
      }
    });
  } catch (error) {
    console.error('❌ [DOWNLOAD DEBUG] Erro completo:', error);
    res.status(500).json({ message: 'Error downloading document' });
  }
});

// PATCH /api/accountants/documents/:id/mark-viewed - Mark document as viewed
router.patch('/documents/:id/mark-viewed', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Buscar documento
    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Verificar se é o cliente dono do documento
    if (document.clientId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Marcar como visualizado
    await document.update({ viewed: true });

    console.log(`✅ Documento ${id} marcado como visualizado por ${userId}`);
    res.json({ success: true, message: 'Document marked as viewed' });
  } catch (error) {
    console.error('Error marking document as viewed:', error);
    res.status(500).json({ message: 'Error updating document' });
  }
});

// GET /api/accountants/documents/unviewed/count - Count unviewed documents
router.get('/documents/unviewed/count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Document.count({
      where: { 
        clientId: userId,
        viewed: false 
      }
    });

    console.log(`📊 Cliente ${userId} tem ${count} documentos não visualizados`);
    res.json({ count });
  } catch (error) {
    console.error('Error counting unviewed documents:', error);
    res.status(500).json({ message: 'Error counting documents' });
  }
});

module.exports = router;