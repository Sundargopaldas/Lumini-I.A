const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Op } = require('sequelize');
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

      // 1. History-based (Simple match)
      // Check if user has categorized a similar transaction before
      // We search for transactions with the same description (or very similar)
      const historicTransaction = await Transaction.findOne({
        where: {
            userId,
            description: t.description,
            categoryId: { [Op.ne]: null }
        },
        order: [['date', 'DESC']]
      });

      if (historicTransaction) {
          categoryId = historicTransaction.categoryId;
      } else {
          // 2. Keyword-based (Fallback)
          const KEYWORD_RULES = [
            { keywords: ['uber', '99', 'taxi', 'posto', 'combustivel', 'gas', 'shell', 'ipiranga', 'parking', 'estacionamento'], category: 'Transport' },
            { keywords: ['ifood', 'burger', 'mcdonald', 'restaurante', 'market', 'supermercado', 'carrefour', 'pao de acucar', 'food', 'coffee', 'padaria'], category: 'Food' },
            { keywords: ['netflix', 'spotify', 'prime', 'hbo', 'disney', 'apple', 'cinema', 'game', 'steam'], category: 'Entertainment' },
            { keywords: ['amazon', 'mercado livre', 'shopee', 'shein', 'magalu', 'store', 'shop'], category: 'Shopping' },
            { keywords: ['farmacia', 'drogaria', 'hospital', 'medico', 'doctor', 'pharmacy', 'saude'], category: 'Health' },
            { keywords: ['salario', 'salary', 'pagamento', 'deposit', 'remuneracao'], category: 'Salary' },
            { keywords: ['luz', 'agua', 'energia', 'internet', 'claro', 'vivo', 'tim', 'eletropaulo', 'sabesp', 'aluguel', 'condominio'], category: 'Housing' },
            { keywords: ['adobe', 'google', 'aws', 'jetbrains', 'hostgator', 'software'], category: 'Software' },
            { keywords: ['dell', 'samsung', 'apple store', 'kabum', 'eletronico'], category: 'Equipment' }
          ];

          for (const rule of KEYWORD_RULES) {
            if (rule.keywords.some(k => lowerDesc.includes(k))) {
                // Find or create category (Global)
                // Note: Category model does NOT have userId, so we treat them as global/shared
                const [cat] = await Category.findOrCreate({
                    where: { name: rule.category },
                    defaults: { type: 'expense', name: rule.category } 
                });
                categoryId = cat.id;
                break; 
            }
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
