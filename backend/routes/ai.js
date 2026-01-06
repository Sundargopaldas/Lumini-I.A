const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Goal = require('../models/Goal');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const authMiddleware = require('../middleware/auth');
const { Op } = require('sequelize');
const { generateFinancialInsights, chatWithAI } = require('../services/geminiService');

// GET /api/ai/insights
// Generates AI-powered insights for the user using Google Gemini
router.get('/insights', authMiddleware, async (req, res) => {
  console.log(`[AI] Generating insights for user ${req.user.id}...`);
  try {
    const userId = req.user.id;
    console.log('[AI] Fetching user...');
    const user = await User.findByPk(userId);
    
    console.log('[AI] Fetching transactions...');
    // Fetch data for context (Last 45 days for better context)
    const now = new Date();
    const pastDate = new Date();
    pastDate.setDate(now.getDate() - 45);
    
    const transactions = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: pastDate
        }
      },
      limit: 40, // Limit to avoid hitting token limits
      order: [['date', 'DESC']],
      include: [Category]
    });
    console.log(`[AI] Found ${transactions.length} transactions.`);

    console.log('[AI] Fetching goals...');
    const goals = await Goal.findAll({
      where: { userId }
    });
    console.log(`[AI] Found ${goals.length} goals.`);

    console.log('[AI] Fetching invoices...');
    const invoices = await Invoice.findAll({
      where: { 
          userId,
          issueDate: {
            [Op.gte]: pastDate
          }
      },
      limit: 20
    });
    console.log(`[AI] Found ${invoices.length} invoices.`);

    // Generate Insights using Gemini Service
    console.log('[AI] Calling Gemini Service...');
    const aiResponse = await generateFinancialInsights(user, transactions, goals, invoices);
    console.log('[AI] Gemini response received. Length:', aiResponse.length);

    // Return as a single "AI Insight" object for the frontend widget
    // The frontend likely expects an array of objects { type, title, message }
    // We will wrap the markdown response in a special object
    
    const insights = [{
        type: 'ai_consultant',
        title: 'Consultor Lumini IA',
        message: aiResponse, // Markdown string
        isMarkdown: true // Flag for frontend to render MD
    }];

    res.json(insights);
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ message: 'Error generating AI insights', error: error.message });
  }
});

// POST /api/ai/chat
// Handles chat messages with context
router.post('/chat', authMiddleware, async (req, res) => {
    try {
        const { message, history } = req.body;
        const userId = req.user.id;
        
        const user = await User.findByPk(userId);
        
        // Context Data
        const now = new Date();
        const pastDate = new Date();
        pastDate.setDate(now.getDate() - 45);
        
        const transactions = await Transaction.findAll({
            where: { userId, date: { [Op.gte]: pastDate } },
            limit: 40,
            order: [['date', 'DESC']],
            include: [Category]
        });
        
        const goals = await Goal.findAll({ where: { userId } });

        const response = await chatWithAI(user, transactions, goals, message, history);
        
        res.json({ message: response });
    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({ message: 'Failed to process chat message' });
    }
});

module.exports = router;
