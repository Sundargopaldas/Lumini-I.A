const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Accountant = require('../models/Accountant');
const auth = require('../middleware/auth');
const checkPremium = require('../middleware/checkPremium');

// Configure Multer for Logo Upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/logos');
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Save as userId-timestamp.ext
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens (jpeg, jpg, png, webp) são permitidas!'));
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Check if username already exists
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  console.log('Login attempt:', req.body.email);
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const payload = {
      user: {
        id: user.id
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
      expiresIn: '24h',
    });

    res.json({ 
        token, 
        user: { 
            id: user.id, 
            username: user.username, 
            email: user.email, 
            plan: user.plan,
            name: user.name,
            logo: user.logo // Include logo in login response
        } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Plan
router.put('/plan', auth, async (req, res) => {
  try {
    const { plan } = req.body;
    const validPlans = ['free', 'pro', 'premium', 'agency'];
    
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    await User.update({ plan }, { where: { id: req.user.id } });
    
    res.json({ message: 'Plan updated successfully', plan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Current User
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    // Check if user is an accountant
    const accountant = await Accountant.findOne({ where: { userId: req.user.id } });
    
    console.log('DEBUG /me: User ID:', req.user.id);
    console.log('DEBUG /me: Accountant found:', !!accountant);

    const userData = user.toJSON();
    userData.isAccountant = !!accountant;
    userData.accountantProfileId = accountant ? accountant.id : null;
    
    console.log('DEBUG /me: Response:', userData);

    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const { sendPasswordResetEmail } = require('../services/EmailService');

// Forgot Password (Simulation)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a temporary reset token
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;
    console.log(`[LOG] Reset Link for ${email}: ${resetLink}`);

    // Configuração de envio de email
     if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== 'seu_email@gmail.com') {
       try {
         await sendPasswordResetEmail(user, resetLink);
         console.log(`[SUCCESS] Email enviado para ${email}`);
         return res.json({ message: 'Um email com as instruções foi enviado para você.' });

      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
        // Fallback para desenvolvimento
        if (process.env.NODE_ENV === 'development') {
             return res.status(500).json({ message: 'Erro ao enviar email: ' + emailError.message, devLink: resetLink });
        }
        return res.status(500).json({ message: 'Erro ao enviar email. Tente novamente mais tarde.' });
      }
    } else {
       // Modo de desenvolvimento sem email configurado
       console.log('[DEV] Email não configurado. Retornando link diretamente.');
       if (process.env.NODE_ENV === 'production') {
            return res.status(500).json({ message: 'Serviço de email não configurado.' });
       }
       return res.json({ message: 'Email não configurado. Use o link abaixo (Dev Mode).', resetLink });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    await User.update({ password: hashedPassword }, { where: { id: decoded.id } });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

// Upload Logo
router.post('/logo', auth, (req, res) => {
  const uploadSingle = upload.single('logo');

  uploadSingle(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(400).json({ message: `Erro de upload: ${err.message}` });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(400).json({ message: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhuma imagem enviada.' });
      }

      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

      // Delete old logo if exists
      if (user.logo) {
        const oldPath = path.join(__dirname, '../uploads/logos', user.logo);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Update user
      user.logo = req.file.filename;
      await user.save();

      res.json({ 
          message: 'Logo atualizado com sucesso!', 
          logo: user.logo,
          logoUrl: `/uploads/logos/${user.logo}`
      });

    } catch (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({ message: 'Erro ao fazer upload do logo.' });
    }
  });
});

// Delete Logo
router.delete('/logo', auth, async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
  
      if (user.logo) {
        const oldPath = path.join(__dirname, '../uploads/logos', user.logo);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
        user.logo = null;
        await user.save();
      }
  
      res.json({ message: 'Logo removido com sucesso!' });
  
    } catch (error) {
      console.error('Logo delete error:', error);
      res.status(500).json({ message: 'Erro ao remover logo.' });
    }
});

// Update Profile (Name, Address, CPF/CNPJ, Company Info)
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, address, cpfCnpj, municipalRegistration, taxRegime } = req.body;
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (address !== undefined) user.address = address;
    if (cpfCnpj !== undefined) user.cpfCnpj = cpfCnpj;
    if (municipalRegistration !== undefined) user.municipalRegistration = municipalRegistration;
    if (taxRegime !== undefined) user.taxRegime = taxRegime;

    await user.save();

    // Return updated user object
    const updatedUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        plan: user.plan,
        name: user.name,
        address: user.address,
        cpfCnpj: user.cpfCnpj,
        municipalRegistration: user.municipalRegistration,
        taxRegime: user.taxRegime,
        logo: user.logo
    };

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
