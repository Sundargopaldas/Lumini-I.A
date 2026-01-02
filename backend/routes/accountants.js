const express = require('express');
const router = express.Router();
const Accountant = require('../models/Accountant');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
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
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, email, phone, specialty, description, tags } = req.body;
    const userId = req.user.id; // From authMiddleware

    const newAccountant = await Accountant.create({
      name,
      email,
      phone,
      specialty,
      description,
      tags,
      userId,
      image: req.file ? req.file.path.replace(/\\/g, '/') : null,
      verified: false // Requires admin approval
    });

    res.status(201).json(newAccountant);
  } catch (error) {
    console.error('Error creating accountant:', error);
    res.status(500).json({ message: 'Error registering accountant' });
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

    await accountant.destroy();

    res.json({ message: 'Accountant deleted successfully' });
  } catch (error) {
    console.error('Error deleting accountant:', error);
    res.status(500).json({ message: 'Error deleting accountant' });
  }
});

const User = require('../models/User');

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

const Transaction = require('../models/Transaction');
const { Op } = require('sequelize');

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