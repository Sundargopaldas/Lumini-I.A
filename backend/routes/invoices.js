const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

// Middleware to check for Premium plan
const checkPremium = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    // Allow 'agency' as well if it exists, or just 'premium'
    const allowedPlans = ['premium', 'agency'];
    
    if (!allowedPlans.includes(user.plan)) {
        return res.status(403).json({ 
            message: 'Recurso exclusivo para planos Premium. Faça upgrade para continuar.' 
        });
    }
    next();
  } catch (error) {
    console.error('Plan check error:', error);
    res.status(500).json({ message: 'Server error checking plan' });
  }
};

// List Invoices (Protected + Premium Only)
router.get('/', auth, checkPremium, async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      where: { userId: req.user.id },
      order: [['issueDate', 'DESC']]
    });

    // Format for frontend
    const formattedInvoices = invoices.map(inv => ({
      id: inv.id.toString().padStart(6, '0'), // 000320 format
      originalId: inv.id,
      date: inv.issueDate,
      client: inv.clientName,
      clientDocument: inv.clientDocument,
      clientAddress: inv.clientAddress,
      clientEmail: inv.clientEmail,
      amount: parseFloat(inv.amount),
      status: inv.status,
      service: inv.serviceDescription
    }));

    res.json(formattedInvoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Server error fetching invoices' });
  }
});

// Create Invoice (Manual)
router.post('/', auth, checkPremium, async (req, res) => {
  try {
    const { 
      clientName, 
      document, 
      email, 
      cep, 
      address, 
      neighborhood, 
      city, 
      state, 
      serviceDescription, 
      value 
    } = req.body;

    const fullAddress = `${address}, ${neighborhood}, ${city} - ${state}, CEP: ${cep}`;

    const newInvoice = await Invoice.create({
      userId: req.user.id,
      clientName,
      clientDocument: document,
      clientEmail: email,
      clientAddress: fullAddress,
      serviceDescription,
      amount: value,
      status: 'issued', // Manual is always issued immediately in this demo
      issueDate: new Date()
    });

    // Return formatted
    res.status(201).json({
      id: newInvoice.id.toString().padStart(6, '0'),
      originalId: newInvoice.id,
      date: newInvoice.issueDate,
      client: newInvoice.clientName,
      amount: parseFloat(newInvoice.amount),
      status: newInvoice.status,
      service: newInvoice.serviceDescription
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Server error creating invoice' });
  }
});

// Delete Invoice
router.delete('/:id', auth, checkPremium, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    await invoice.destroy();
    res.json({ message: 'Invoice deleted successfully' });

  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Server error deleting invoice' });
  }
});

module.exports = router;
