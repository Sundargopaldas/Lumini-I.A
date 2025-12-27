const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Certificate = require('../models/Certificate');
const auth = require('../middleware/auth');

// Configure Multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/certificates';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Save as userId-timestamp-filename
    cb(null, `${req.user.id}-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/x-pkcs12' || file.originalname.endsWith('.pfx') || file.originalname.endsWith('.p12')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos .pfx ou .p12 são permitidos.'));
    }
  }
});

// Get User Certificate
router.get('/', auth, async (req, res) => {
  try {
    const cert = await Certificate.findOne({ where: { userId: req.user.id } });
    if (!cert) return res.status(404).json({ message: 'Nenhum certificado encontrado.' });
    
    // Don't send password back
    const { password, ...certData } = cert.toJSON();
    res.json(certData);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ message: 'Erro ao buscar certificado.' });
  }
});

// Upload Certificate
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { cnpj, razaoSocial, inscricaoMunicipal, password } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Arquivo do certificado é obrigatório.' });
    }

    // Check if user already has a certificate and update or create
    let cert = await Certificate.findOne({ where: { userId: req.user.id } });

    if (cert) {
      // Delete old file if exists
      const oldPath = path.join('uploads/certificates', cert.filename);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      
      await cert.update({
        cnpj,
        razaoSocial,
        inscricaoMunicipal,
        filename: req.file.filename,
        password, // Ideally encrypt this
        status: 'active',
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // Mock expiry 1 year from now
      });
    } else {
      cert = await Certificate.create({
        userId: req.user.id,
        cnpj,
        razaoSocial,
        inscricaoMunicipal,
        filename: req.file.filename,
        password,
        status: 'active',
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      });
    }

    const { password: _, ...certResponse } = cert.toJSON();
    res.status(201).json(certResponse);

  } catch (error) {
    console.error('Error uploading certificate:', error);
    res.status(500).json({ message: 'Erro ao salvar certificado.' });
  }
});

// Delete Certificate
router.delete('/', auth, async (req, res) => {
    try {
        const cert = await Certificate.findOne({ where: { userId: req.user.id } });
        if (!cert) return res.status(404).json({ message: 'Certificado não encontrado.' });

        // Delete file
        const filePath = path.join('uploads/certificates', cert.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await cert.destroy();
        res.json({ message: 'Certificado removido com sucesso.' });
    } catch (error) {
        console.error('Error deleting certificate:', error);
        res.status(500).json({ message: 'Erro ao remover certificado.' });
    }
});

module.exports = router;
