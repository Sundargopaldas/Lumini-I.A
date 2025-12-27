const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { sendInvoiceEmail } = require('../services/EmailService');
const auth = require('../middleware/auth');
const checkPremium = require('../middleware/checkPremium');
const { Op } = require('sequelize');

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
      clientStateRegistration: inv.clientStateRegistration,
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
      stateRegistration, 
      email, 
      cep, 
      address, 
      neighborhood, 
      city, 
      state, 
      serviceDescription, 
      value 
    } = req.body;

    // Construct address only with present fields
    const addressParts = [];
    if (address) addressParts.push(address);
    if (neighborhood) addressParts.push(neighborhood);
    if (city || state) addressParts.push(`${city || ''} - ${state || ''}`);
    if (cep) addressParts.push(`CEP: ${cep}`);
    
    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Não Informado';

    const newInvoice = await Invoice.create({
      userId: req.user.id,
      clientName,
      clientDocument: document,
      clientStateRegistration: stateRegistration,
      clientEmail: email,
      clientAddress: fullAddress,
      serviceDescription,
      amount: value,
      status: 'issued', // Manual is always issued immediately in this demo
      issueDate: new Date()
    });

    // Automatically create a Transaction (Income) for this invoice
    await Transaction.create({
      description: `Nota Fiscal #${newInvoice.id} - ${clientName}`,
      amount: value,
      type: 'income',
      source: 'Invoice',
      date: new Date(),
      userId: req.user.id
    });

    // Send Email to Client
    if (email) {
      sendInvoiceEmail(email, {
        id: newInvoice.id,
        clientName,
        serviceDescription,
        amount: value,
        issueDate: newInvoice.issueDate
      });
    }

    // Return formatted
    res.status(201).json({
      id: newInvoice.id.toString().padStart(6, '0'),
      originalId: newInvoice.id,
      date: newInvoice.issueDate,
      client: newInvoice.clientName,
      clientDocument: newInvoice.clientDocument,
      clientStateRegistration: newInvoice.clientStateRegistration,
      clientEmail: newInvoice.clientEmail,
      clientAddress: newInvoice.clientAddress,
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
