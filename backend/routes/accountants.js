const express = require('express');
const router = express.Router();
const Accountant = require('../models/Accountant');
const Transaction = require('../models/Transaction');
const { Op } = require('sequelize');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const EmailService = require('../services/EmailService');

// Configure Multer for Image Upload
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




// POST /api/accountants/invite - Invite/Link an accountant
router.post('/invite', authMiddleware, async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
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
            try {
                await EmailService.sendNewClientNotification(user, email);
            } catch (emailErr) {
                console.error('Failed to send new client notification:', emailErr);
            }

            return res.json({ status: 'linked', message: 'Contador vinculado com sucesso! Agora ele tem acesso aos seus dados fiscais.' });
        }

        // 2. If not found, send invite email
        try {
            await EmailService.sendInviteEmail(user, email);
        } catch (emailErr) {
            console.error('Failed to send invite email:', emailErr);
            // Continue even if email fails, to tell user we tried
        }

        return res.json({ status: 'invited', message: `Convite enviado para ${email}. Assim que ele se cadastrar como contador, o vínculo será automático.` });

    } catch (error) {
        console.error('Invite error:', error);
        res.status(500).json({ message: 'Error processing invite' });
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

    res.json(accountants);
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

// DELETE /api/accountants/:id - Delete an accountant (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const accountant = await Accountant.findByPk(id);

    if (!accountant) {
      return res.status(404).json({ message: 'Accountant not found' });
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

        user.accountantId = null;
        await user.save();

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

module.exports = router;