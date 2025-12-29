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

      // Try to auto-categorize (basic)
      // TODO: Implement smarter categorization based on description keywords
      
      await Transaction.create({
        userId,
        amount: t.amount,
        type: t.type,
        date: t.date,
        description: t.description,
        fitId: t.fitId,
        source: 'OFX Import'
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
