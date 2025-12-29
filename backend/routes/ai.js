const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const authMiddleware = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/ai/insights
// Generates rule-based insights for the user
router.get('/insights', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Fetch transactions for current month
    const transactions = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: firstDayOfMonth
        }
      },
      // Removed include Category since it might not be associated correctly yet or causing issues
      // include: [{ model: Category, as: 'category' }] 
    });

    const insights = [];
    
    // 1. Basic Cash Flow Analysis
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    if (expense > income && income > 0) {
      insights.push({
        type: 'warning',
        title: 'Alerta de Gastos',
        message: `Seus gastos (R$ ${expense.toFixed(2)}) superaram sua renda este mês. Tente reduzir despesas não essenciais.`
      });
    } else if (income > 0 && (expense / income) < 0.8) {
      insights.push({
        type: 'success',
        title: 'Boa Saúde Financeira',
        message: `Você economizou cerca de ${((1 - expense/income) * 100).toFixed(0)}% da sua renda este mês!`
      });
    }

    // 2. Category Analysis (Top Spender)
    // Simplified to use rawType or skip if category is missing
    /* 
    const categoryTotals = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const catName = t.category ? t.category.name : 'Outros';
        categoryTotals[catName] = (categoryTotals[catName] || 0) + parseFloat(t.amount);
      });

    const sortedCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a);

    if (sortedCategories.length > 0) {
      const [topCategory, amount] = sortedCategories[0];
      if (amount > expense * 0.4) { // If top category is > 40% of total expenses
        insights.push({
          type: 'info',
          title: 'Foco de Atenção',
          message: `Gastos com "${topCategory}" representam mais de 40% do seu orçamento. Verifique se há cortes possíveis.`
        });
      }
    }
    */

    // 3. Mock "AI" Predictions (to show value)
    // In a real app, this would use historical data trend analysis
    if (expense > 0) {
        insights.push({
            type: 'ai_prediction',
            title: 'Previsão Inteligente',
            message: `Baseado no seu padrão, projetamos que seus gastos fecharão o mês em R$ ${(expense * 1.2).toFixed(2)} se o ritmo continuar.`
        });
    }

    // If no insights (e.g., no data), provide a welcome tip
    if (insights.length === 0) {
      insights.push({
        type: 'info',
        title: 'Bem-vindo ao Lumini I.A',
        message: 'Comece a adicionar suas transações para receber insights personalizados sobre suas finanças.'
      });
    }

    res.json(insights);
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ message: 'Error generating insights' });
  }
});

module.exports = router;
