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
const { validatePassword: validatePasswordStrength } = require('../utils/passwordValidator');
const { recordFailedAttempt, isBlocked, clearAttempts } = require('../utils/loginAttempts');
const { validate, schemas } = require('../middleware/validator');
const { createLogger } = require('../utils/logger');
const TokenService = require('../services/TokenService');
const EmailValidator = require('../utils/emailValidator');

const logger = createLogger('AUTH');

// 🔒 Endpoint para validar força de senha (sem autenticação)
router.post('/validate-password', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  const validation = validatePasswordStrength(password);
  
  res.json({
    valid: validation.valid,
    strength: validation.strength,
    errors: validation.errors,
    strengthLevel: 
      validation.strength >= 80 ? 'Muito Forte' :
      validation.strength >= 60 ? 'Forte' :
      validation.strength >= 40 ? 'Média' :
      validation.strength >= 20 ? 'Fraca' : 'Muito Fraca'
  });
});

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit para alta qualidade
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|svg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens (jpeg, jpg, png, webp, svg) são permitidas!'));
  }
});

// Register
router.post('/register', validate(schemas.registerSchema), async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate email existence
    const emailValidation = await EmailValidator.validate(email);
    if (!emailValidation.valid) {
      console.log(`❌ [REGISTER] Email inválido: ${email} - Razão: ${emailValidation.reason}`);
      return res.status(400).json({ 
        message: emailValidation.reason
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        message: 'Senha não atende aos requisitos de segurança',
        errors: passwordValidation.errors,
        strength: passwordValidation.strength
      });
    }
    
    console.log(`✅ [SECURITY] Senha forte criada (força: ${passwordValidation.strength}%) para ${email}`);

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
router.post('/login', validate(schemas.loginSchema), async (req, res) => {
  console.log('Login attempt:', req.body.email);
  logger.auth('Login attempt', req.body.email);
  
  try {
    const { email, password } = req.body;
    
    // Validate email existence
    const emailValidation = await EmailValidator.validate(email);
    if (!emailValidation.valid) {
      console.log(`❌ [LOGIN] Email inválido: ${email} - Razão: ${emailValidation.reason}`);
      return res.status(400).json({ 
        message: 'Email inválido ou não existe'
      });
    }
    
    // 🔒 SEGURANÇA: Verificar se a conta está bloqueada
    const blockStatus = isBlocked(email);
    if (blockStatus.blocked) {
      logger.auth(`Login blocked - too many attempts`, email, false);
      return res.status(429).json({ 
        message: `Conta temporariamente bloqueada devido a múltiplas tentativas falhadas. Tente novamente em ${blockStatus.remainingMinutes} minutos.`,
        blocked: true,
        blockedUntil: blockStatus.blockedUntil
      });
    }

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // 🔒 SEGURANÇA: Registrar tentativa falhada
      const attemptResult = recordFailedAttempt(email);
      logger.auth('Login failed - user not found', email, false);
      
      if (attemptResult.blocked) {
        return res.status(429).json({ 
          message: `Muitas tentativas falhadas. Conta bloqueada por ${attemptResult.remainingMinutes} minutos.`,
          blocked: true,
          blockedUntil: attemptResult.blockedUntil
        });
      }
      
      return res.status(400).json({ 
        message: 'Credenciais inválidas',
        remainingAttempts: attemptResult.remainingAttempts
      });
    }

    // Check password (com timing constante para prevenir timing attacks)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // 🔒 SEGURANÇA: Registrar tentativa falhada
      const attemptResult = recordFailedAttempt(email);
      logger.auth('Login failed - invalid password', email, false);
      
      if (attemptResult.blocked) {
        return res.status(429).json({ 
          message: `Muitas tentativas falhadas. Conta bloqueada por ${attemptResult.remainingMinutes} minutos.`,
          blocked: true,
          blockedUntil: attemptResult.blockedUntil
        });
      }
      
      return res.status(400).json({ 
        message: 'Credenciais inválidas',
        remainingAttempts: attemptResult.remainingAttempts
      });
    }
    
    // 🔒 SEGURANÇA: Limpar tentativas após login bem-sucedido
    clearAttempts(email);
    logger.auth('Login successful', user.id, true);

    // Generate token
    if (!process.env.JWT_SECRET) {
      console.error('[AUTH] FATAL: JWT_SECRET not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const payload = {
      user: {
        id: user.id
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
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
            isAdmin: user.isAdmin,
            logo: user.logo, // Include logo in login response
            cpfCnpj: user.cpfCnpj, // Include CPF/CNPJ for PDF reports
            address: user.address // Include address for PDF reports
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
    
    console.log('🔍 [/ME] User ID:', req.user.id);
    console.log('🔍 [/ME] User Logo (raw):', user.logo);
    console.log('🔍 [/ME] Accountant found:', !!accountant);

    const userData = user.toJSON();
    userData.isAccountant = !!accountant;
    userData.isAdmin = !!user.isAdmin; // Ensure boolean
    userData.accountantProfileId = accountant ? accountant.id : null;
    
    console.log('✅ [/ME] Response Logo:', userData.logo);

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
    console.log(`\n🔐 [FORGOT-PASSWORD] Solicitação para: ${email}`);
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log(`❌ [FORGOT-PASSWORD] Usuário não encontrado: ${email}`);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    console.log(`✅ [FORGOT-PASSWORD] Usuário encontrado: ${user.name} (${user.email})`);

    // Generate a temporary reset token
    if (!process.env.JWT_SECRET) {
      console.error('❌ [FORGOT-PASSWORD] FATAL: JWT_SECRET não configurado!');
      return res.status(500).json({ message: 'Erro de configuração do servidor' });
    }
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const frontendUrl = process.env.FRONTEND_URL || 'https://www.luminiiadigital.com.br';
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;
    console.log(`🔗 [FORGOT-PASSWORD] Link gerado: ${resetLink}`);

    // Configuração de envio de email
    console.log(`📧 [FORGOT-PASSWORD] Tentando enviar email...`);
    try {
        // Tenta enviar o email. O EmailService vai verificar se há config no Banco ou .env
        await sendPasswordResetEmail(user, resetLink);
        console.log(`✅ [FORGOT-PASSWORD] Email enviado com sucesso para ${email}`);
        return res.json({ message: 'Um email com as instruções foi enviado para você.' });

    } catch (emailError) {
        console.error('❌ [FORGOT-PASSWORD] Erro ao enviar email:', emailError);
        console.error('❌ [FORGOT-PASSWORD] Código do erro:', emailError.code);
        console.error('❌ [FORGOT-PASSWORD] Mensagem:', emailError.message);
        console.error('❌ [FORGOT-PASSWORD] Stack:', emailError.stack);
        
        // Retornar erro detalhado sempre (não só em DEV)
        return res.status(500).json({ 
          message: `Erro ao enviar email: ${emailError.message}`,
          code: emailError.code || 'UNKNOWN',
          details: 'Verifique as configurações de SMTP no painel Admin > Configurações do Sistema'
        });
    }
  } catch (error) {
    console.error('❌ [FORGOT-PASSWORD] Erro geral:', error);
    res.status(500).json({ message: 'Erro no servidor: ' + error.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    console.log('🔐 [RESET-PASSWORD] Iniciando reset de senha...');
    
    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      console.log('❌ [RESET-PASSWORD] Senha fraca:', passwordValidation.errors);
      return res.status(400).json({ 
        message: 'Senha não atende aos requisitos de segurança',
        errors: passwordValidation.errors
      });
    }
    
    // Verify token
    if (!process.env.JWT_SECRET) {
      console.error('[RESET-PASSWORD] FATAL: JWT_SECRET not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    console.log('🔍 [RESET-PASSWORD] Verificando token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ [RESET-PASSWORD] Token válido para user ID: ${decoded.id}`);
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    await User.update({ password: hashedPassword }, { where: { id: decoded.id } });
    console.log(`✅ [RESET-PASSWORD] Senha atualizada com sucesso para user ID: ${decoded.id}`);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('❌ [RESET-PASSWORD] Erro:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Token expirado. Solicite um novo link de recuperação.' });
    }
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

// EMERGENCY ROUTE REMOVED FOR SECURITY
// Use backend/upgrade_user.js script instead

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
router.put('/profile', auth, validate(schemas.updateProfileSchema), async (req, res) => {
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

// ========== REFRESH TOKEN ROUTES (OPCIONAL - Não quebra login atual) ==========

/**
 * POST /api/auth/refresh
 * Renova access token usando refresh token
 * 
 * Body: { refreshToken: "..." }
 * Returns: { accessToken: "...", refreshToken: "..." }
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const tokens = await TokenService.refreshAccessToken(refreshToken);
    
    logger.info('Token refreshed successfully');
    res.json(tokens);
  } catch (error) {
    logger.warn('Token refresh failed', { error: error.message });
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

/**
 * POST /api/auth/logout-all
 * Revoga todos os refresh tokens do usuário (logout de todos dispositivos)
 */
router.post('/logout-all', auth, async (req, res) => {
  try {
    await TokenService.revokeAllUserTokens(req.user.id);
    
    logger.info('All tokens revoked', { userId: req.user.id });
    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    logger.error('Logout all failed', { error });
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
