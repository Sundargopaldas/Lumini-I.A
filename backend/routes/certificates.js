const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Certificate = require('../models/Certificate');

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/certificates';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Save with unique name: userId-timestamp-origName
    cb(null, `${req.user.id}-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/x-pkcs12' || file.originalname.endsWith('.pfx') || file.originalname.endsWith('.p12')) {
            cb(null, true);
        } else {
            cb(new Error('Formato inválido. Envie um arquivo .pfx ou .p12'));
        }
    }
});

const nuvemFiscalService = require('../services/nuvemFiscalService');

// Upload Certificate
router.post('/upload', auth, upload.single('certificate'), async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ message: 'Arquivo de certificado é obrigatório.' });
    }
    
    if (!password) {
        // Clean up uploaded file if password missing
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Senha do certificado é obrigatória.' });
    }

    // --- INTEGRATION WITH NUVEM FISCAL ---
    // Read the file buffer
    const certificateBuffer = fs.readFileSync(req.file.path);
    
    // Call Nuvem Fiscal Service to register certificate
    // Assuming user's CPF/CNPJ is stored in req.user or fetched from DB
    // For now, we'll need to fetch the User to get their CNPJ
    const User = require('../models/User');
    const user = await User.findByPk(req.user.id);
    
    if (!user || !user.cpfCnpj) {
         throw new Error('Usuário não possui CPF/CNPJ cadastrado para vincular o certificado.');
    }

    // Register in Nuvem Fiscal
    // Note: We need to implement registerCertificate in nuvemFiscalService
    await nuvemFiscalService.registerCertificate(user.cpfCnpj, certificateBuffer, password);

    // --- REAL WORLD SIMULATION (Fallback/Meta storage) ---
    // Here we would use 'node-forge' to read the PFX, try to unlock with password,
    // and extract the Expiration Date and CNPJ.
    // For now, we simulate a valid certificate that expires in 1 year.
    const mockExpirationDate = new Date();
    mockExpirationDate.setFullYear(mockExpirationDate.getFullYear() + 1);
    // -----------------------------

    // Check if user already has a certificate and replace it
    const existingCert = await Certificate.findOne({ where: { userId: req.user.id } });
    if (existingCert) {
        // Delete old file
        if (fs.existsSync(existingCert.path)) {
            fs.unlinkSync(existingCert.path);
        }
        await existingCert.destroy();
    }

    const newCert = await Certificate.create({
      userId: req.user.id,
      filename: req.file.originalname,
      path: req.file.path,
      password: password, // In prod, encrypt this!
      expirationDate: mockExpirationDate,
      status: 'active'
    });

    res.json({ 
        message: 'Certificado digital configurado e vinculado à Nuvem Fiscal com sucesso.',
        expiration: mockExpirationDate
    });

  } catch (error) {
    console.error('Certificate upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }
    // Return specific error message if available
    res.status(500).json({ message: error.message || 'Erro ao processar certificado.' });
  }
});

// Get Certificate Status
router.get('/status', auth, async (req, res) => {
    try {
        const cert = await Certificate.findOne({ where: { userId: req.user.id } });
        if (!cert) {
            // Return 200 OK with configured: false to avoid 404 errors in console
            return res.json({ configured: false });
        }

        res.json({
            configured: true,
            expirationDate: cert.expirationDate,
            filename: cert.filename,
            status: cert.status
        });
    } catch (error) {
        console.error('Error fetching cert status:', error);
        res.json({ configured: false });
    }
});

// Delete Certificate
router.delete('/', auth, async (req, res) => {
    try {
        const cert = await Certificate.findOne({ where: { userId: req.user.id } });
        if (cert) {
            if (fs.existsSync(cert.path)) {
                fs.unlinkSync(cert.path);
            }
            await cert.destroy();
        }
        res.json({ message: 'Certificado removido com sucesso.' });
    } catch (error) {
        console.error('Error deleting certificate:', error);
        res.status(500).json({ message: 'Erro ao remover certificado.' });
    }
});

module.exports = router;
