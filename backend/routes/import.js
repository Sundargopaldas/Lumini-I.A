const express = require('express');
const router = express.Router();
const multer = require('multer');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const authMiddleware = require('../middleware/auth');
const { parseOFX } = require('../utils/ofxParser');

// Configure Multer for memory storage (no need to save OFX files to disk)
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/import/ofx
router.post('/ofx', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user.id;
    const ofxContent = req.file.buffer.toString('utf8');
    
    // Parse transactions
    const parsedTransactions = parseOFX(ofxContent);
    
    if (parsedTransactions.length === 0) {
      return res.status(400).json({ message: 'No valid transactions found in OFX file' });
    }

    let importedCount = 0;
    let duplicateCount = 0;

    // Process each transaction
    for (const t of parsedTransactions) {
      // Check for duplicate by fitId
      const existing = await Transaction.findOne({
        where: {
          userId,
          fitId: t.fitId
        }
      });

      if (existing) {
        duplicateCount++;
        continue;
      }

      // Smart Categorization
      let categoryId = null;
      const lowerDesc = t.description.toLowerCase();
      
      const KEYWORD_RULES = [
        { keywords: ['uber', '99', 'taxi', 'posto', 'combustivel', 'estacionamento'], category: 'Transporte' },
        { keywords: ['supermercado', 'atacad', 'carrefour', 'pao de acucar', 'restaurante', 'ifood', 'burger', 'mcdonalds', 'food'], category: 'Alimentação' },
        { keywords: ['netflix', 'spotify', 'cinema', 'amazon prime', 'hbo'], category: 'Lazer' },
        { keywords: ['amazon', 'magalu', 'mercado livre', 'shopee', 'shein'], category: 'Compras' },
        { keywords: ['pharmacy', 'drogaria', 'farmacia', 'hospital', 'consultorio', 'medico'], category: 'Saúde' },
        { keywords: ['salario', 'pagamento', 'recebimento'], category: 'Salário' },
        { keywords: ['luz', 'agua', 'energia', 'internet', 'claro', 'vivo', 'tim'], category: 'Contas' }
      ];

      for (const rule of KEYWORD_RULES) {
        if (rule.keywords.some(k => lowerDesc.includes(k))) {
            // Find or create category
            const [cat] = await Category.findOrCreate({
                where: { name: rule.category, userId },
                defaults: { type: 'expense', color: '#888888', icon: 'tag' } // Default values
            });
            categoryId = cat.id;
            break; 
        }
      }
      
      await Transaction.create({
        userId,
        amount: t.amount,
        type: t.type,
        date: t.date,
        description: t.description,
        fitId: t.fitId,
        source: 'OFX Import',
        categoryId: categoryId
      });
      
      importedCount++;
    }

    res.json({
      message: 'Import processing complete',
      summary: {
        totalFound: parsedTransactions.length,
        imported: importedCount,
        duplicates: duplicateCount
      }
    });

  } catch (error) {
    console.error('OFX Import Error:', error);
    res.status(500).json({ message: 'Error processing OFX file' });
  }
});

module.exports = router;
