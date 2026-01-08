const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Certificate = require('../models/Certificate');
const { sendInvoiceEmail } = require('../services/EmailService');
const auth = require('../middleware/auth');
const checkPremium = require('../middleware/checkPremium');
const { Op } = require('sequelize');
const { validateCPF, validateCNPJ, validateStateRegistration } = require('../utils/validators');
const nuvemFiscalService = require('../services/nuvemFiscalService');

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
      type: inv.type, // Added type
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
      value,
      taxAmount,
      clientState,
      type // 'official' or 'receipt'
    } = req.body;

    // --- Validation ---
    if (!document) {
        return res.status(400).json({ message: 'Documento (CPF/CNPJ) é obrigatório.' });
    }

    const cleanDoc = document.replace(/\D/g, '');
    let isValidDoc = false;

    if (cleanDoc.length === 11) {
        isValidDoc = validateCPF(cleanDoc);
    } else if (cleanDoc.length === 14) {
        isValidDoc = validateCNPJ(cleanDoc);
    }

    if (!isValidDoc) {
        return res.status(400).json({ message: 'CPF ou CNPJ inválido.' });
    }

    if (stateRegistration && !validateStateRegistration(stateRegistration)) {
        return res.status(400).json({ message: 'Inscrição Estadual inválida.' });
    }
    // ------------------

    // Construct address only with present fields
    const addressParts = [];
    if (address) addressParts.push(address);
    if (neighborhood) addressParts.push(neighborhood);
    if (city || state) addressParts.push(`${city || ''} - ${state || ''}`);
    if (cep) addressParts.push(`CEP: ${cep}`);
    
    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Não Informado';

    // Determine status based on type and configuration
    const isMock = process.env.NUVEM_FISCAL_MOCK === 'true';
    const hasCredentials = process.env.NUVEM_FISCAL_CLIENT_ID && process.env.NUVEM_FISCAL_CLIENT_ID !== 'your_client_id_here';
    
    // Check for active certificate
    const userCert = await Certificate.findOne({ where: { userId: req.user.id, status: 'active' } });
    const hasCertificate = !!userCert;

    let shouldEmit = false;
    let initialStatus = 'issued';

    if (type === 'official') {
        if (isMock) {
            shouldEmit = true;
            initialStatus = 'processing';
        } else if (hasCredentials) {
            if (hasCertificate) {
                shouldEmit = true;
                initialStatus = 'processing';
            } else {
                // User requested official invoice but has no certificate
                initialStatus = 'error';
                console.warn(`User ${req.user.id} requested official invoice without certificate.`);
            }
        }
    }

    const newInvoice = await Invoice.create({
      userId: req.user.id,
      clientName,
      clientDocument: document,
      clientStateRegistration: stateRegistration,
      clientEmail: email,
      clientAddress: fullAddress,
      serviceDescription,
      amount: value,
      taxAmount: taxAmount || 0,
      clientState: clientState || state,
      status: initialStatus,
      type: type || 'official',
      issueDate: new Date()
    });

    // --- NUVEM FISCAL INTEGRATION (Optional) ---
    // If keys are present in .env and type is 'official' (or Mock mode is on), try to emit
    if (shouldEmit) {
        try {
            console.log('Tentando emitir via Nuvem Fiscal...');
             
             // Note: This requires the User (req.user) to have CPF/CNPJ and address configured correctly.
             const result = await nuvemFiscalService.emitNfse(newInvoice, req.user);
             
             // If successful:
             newInvoice.status = 'issued';
             // newInvoice.externalReference = result.data.id; 
             await newInvoice.save();
             
             console.log('NFS-e emitida com sucesso (Simulação/Sandbox).');
        } catch (nfError) {
             console.error('Erro na integração Nuvem Fiscal:', nfError.message);
             // On error, revert to 'error' status or keep 'processing'
             newInvoice.status = 'error';
             await newInvoice.save();
        }
    }
    // -------------------------------------------

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
      type: newInvoice.type,
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
