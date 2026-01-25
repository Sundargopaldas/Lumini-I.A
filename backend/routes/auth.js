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
    const { username, email, password, inviteToken } = req.body;

    // Validar e processar convite (se fornecido)
    let accountantIdFromInvite = null;
    if (inviteToken) {
      const InviteToken = require('../models/InviteToken');
      const invite = await InviteToken.findOne({ 
        where: { 
          token: inviteToken,
          email: email, // Deve ser para este email
          used: false 
        } 
      });

      if (!invite) {
        return res.status(400).json({ 
          message: 'Convite inválido ou já utilizado' 
        });
      }

      // Verificar se expirou
      if (new Date() > invite.expiresAt) {
        return res.status(400).json({ 
          message: 'Este convite expirou. Solicite um novo convite ao seu contador.' 
        });
      }

      accountantIdFromInvite = invite.accountantId;
      console.log(`✅ [INVITE] Convite válido encontrado! AccountantId: ${accountantIdFromInvite}`);
    }

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

    // Generate verification token
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Create user (com accountantId se veio de convite)
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      emailVerified: false,
      verificationToken,
      accountantId: accountantIdFromInvite // Vincular automaticamente ao contador
    });

    // Se foi criado via convite, marcar o token como usado e criar notificação
    if (inviteToken && accountantIdFromInvite) {
      const InviteToken = require('../models/InviteToken');
      await InviteToken.update(
        { used: true },
        { where: { token: inviteToken } }
      );

      // Criar notificação para o contador
      const Notification = require('../models/Notification');
      const Accountant = require('../models/Accountant');
      
      const accountant = await Accountant.findByPk(accountantIdFromInvite);
      if (accountant) {
        await Notification.create({
          accountantId: accountant.id,
          userId: user.id,
          type: 'new_client',
          title: '🎉 Novo Cliente Cadastrado',
          message: `${user.username} aceitou seu convite e criou uma conta!`,
          metadata: {
            clientId: user.id,
            clientName: user.username,
            clientEmail: user.email,
            viaInvite: true
          }
        });

        console.log(`✅ [INVITE] Notificação criada para o contador ${accountant.id}`);
      }
    }

    // Send verification email
    let emailSent = false;
    let emailError = null;
    
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'https://lumini-i-a.fly.dev';
      const encodedToken = encodeURIComponent(verificationToken); // Encode token para URL
      const verificationLink = `${frontendUrl}/verify-email/${encodedToken}`;
      
      console.log(`📧 [REGISTER] Enviando email de verificação para: ${email}`);
      console.log(`🔗 [REGISTER] Link de verificação: ${verificationLink}`);
      await sendVerificationEmail(user, verificationLink);
      console.log(`✅ [REGISTER] Email de verificação enviado com sucesso!`);
      emailSent = true;
    } catch (emailError) {
      console.error('❌ [REGISTER] Erro ao enviar email de verificação:', emailError);
      console.error('❌ [REGISTER] Erro detalhado:', {
        message: emailError.message,
        code: emailError.code,
        stack: emailError.stack
      });
      emailError = emailError.message || 'Erro desconhecido ao enviar email';
      // Não bloqueamos o registro se o email falhar
    }

    res.status(201).json({ 
      message: 'Cadastro realizado com sucesso! Você já pode fazer login.',
      emailSent: emailSent,
      emailError: emailError,
      note: emailSent 
        ? 'Um email de confirmação foi enviado, mas você já pode usar o sistema.'
        : 'Não foi possível enviar o email de confirmação. Use o botão "Reenviar Email" na página de verificação.'
    });
  } catch (error) {
    console.error('❌ [REGISTER] Registration Error:', error);
    console.error('❌ [REGISTER] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Mensagens de erro mais específicas
    let errorMessage = 'Erro ao cadastrar. Tente novamente.';
    let statusCode = 500;
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      errorMessage = 'Email ou nome de usuário já está em uso.';
      statusCode = 400;
    } else if (error.name === 'SequelizeValidationError') {
      // Extrair mensagens específicas de validação
      const validationErrors = error.errors || [];
      const errorMessages = validationErrors.map(err => err.message).filter(Boolean);
      
      if (errorMessages.length > 0) {
        errorMessage = errorMessages[0]; // Primeira mensagem de erro
      } else {
        errorMessage = 'Dados inválidos. Verifique os campos preenchidos.';
      }
      statusCode = 400;
    } else if (error.name === 'SequelizeDatabaseError') {
      errorMessage = 'Erro no banco de dados. Contate o suporte.';
      console.error('❌ [REGISTER] Database Error:', error.original);
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({ 
      message: errorMessage,
      error: error.name,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

    // Check email verification status
    // REGRAS:
    // 1. Admins sempre podem fazer login (bypass)
    // 2. Usuários antigos (sem verificationToken) podem fazer login (criados antes da implementação)
    // 3. Novos usuários (com verificationToken mas não verificado) precisam verificar email
    const isOldUser = !user.verificationToken; // Usuário criado antes da implementação
    const isNewUnverifiedUser = user.verificationToken && !user.emailVerified;
    
    if (isNewUnverifiedUser && !user.isAdmin) {
      console.log(`⚠️ [LOGIN] Email não verificado para NOVO usuário: ${email} - BLOQUEANDO LOGIN`);
      return res.status(403).json({ 
        message: 'Confirme seu email!',
        error: 'EMAIL_NOT_VERIFIED',
        email: user.email,
        details: 'Verifique sua caixa de entrada e clique no link de confirmação que enviamos.'
      });
    }
    
    // Log para diferentes casos
    if (isOldUser && !user.emailVerified) {
      console.log(`ℹ️ [LOGIN] Usuário antigo sem email verificado: ${email} - PERMITINDO LOGIN (usuário antigo)`);
    } else if (user.isAdmin && !user.emailVerified) {
      console.log(`ℹ️ [LOGIN] Admin sem email verificado: ${email} - PERMITINDO LOGIN (admin bypass)`);
    }

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
            address: user.address, // Include address for PDF reports
            emailVerified: user.emailVerified // Include email verification status
        },
        emailVerified: user.emailVerified // Also include at root level for easy access
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

const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/EmailService');

// Resend Verification Email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }
    
    console.log(`📧 [RESEND] Solicitação de reenvio para: ${email}`);
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email já está verificado!' });
    }
    
    // Generate new verification token
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    // Update token in database
    await User.update(
      { verificationToken },
      { where: { id: user.id } }
    );
    
    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || 'https://lumini-i-a.fly.dev';
    const encodedToken = encodeURIComponent(verificationToken);
    const verificationLink = `${frontendUrl}/verify-email/${encodedToken}`;
    
    await sendVerificationEmail(user, verificationLink);
    
    console.log(`✅ [RESEND] Email de verificação reenviado para: ${email}`);
    
    res.json({ 
      message: 'Email de verificação reenviado com sucesso!',
      success: true
    });
  } catch (error) {
    console.error('❌ [RESEND] Erro:', error);
    res.status(500).json({ message: 'Erro ao reenviar email' });
  }
});

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

// Verify Email
router.get('/verify-email/:token', async (req, res) => {
  try {
    let { token } = req.params;
    
    console.log('✉️ [VERIFY-EMAIL] Iniciando verificação de email...');
    console.log('🔍 [VERIFY-EMAIL] Token recebido:', token);
    
    // Decode token from URL (caso tenha sido encoded)
    token = decodeURIComponent(token);
    console.log('🔓 [VERIFY-EMAIL] Token decodificado:', token);
    
    // Verify token
    if (!process.env.JWT_SECRET) {
      console.error('[VERIFY-EMAIL] FATAL: JWT_SECRET not configured');
      return res.status(500).json({ message: 'Erro de configuração do servidor' });
    }
    
    console.log('🔍 [VERIFY-EMAIL] Verificando token JWT...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ [VERIFY-EMAIL] Token válido para email: ${decoded.email}`);
    
    // Find user by email and verificationToken
    console.log('🔍 [VERIFY-EMAIL] Buscando usuário no banco...');
    console.log(`   📧 Email procurado: ${decoded.email}`);
    console.log(`   🔑 Token procurado (50 chars): ${token.substring(0, 50)}...`);
    
    const user = await User.findOne({ 
      where: { 
        email: decoded.email,
        verificationToken: token
      } 
    });

    if (!user) {
      console.log('❌ [VERIFY-EMAIL] Usuário não encontrado ou token já usado');
      
      // Debug: Verificar se existe usuário com esse email mas token diferente
      const userDebug = await User.findOne({ where: { email: decoded.email } });
      if (userDebug) {
        console.log('⚠️  [DEBUG] Usuário EXISTE mas token não bate:');
        console.log(`   🔑 Token no banco (50 chars): ${userDebug.verificationToken?.substring(0, 50)}...`);
        console.log(`   🔑 Token recebido (50 chars): ${token.substring(0, 50)}...`);
        console.log(`   📏 Tamanho token banco: ${userDebug.verificationToken?.length}`);
        console.log(`   📏 Tamanho token recebido: ${token.length}`);
        console.log(`   ✔️  Tokens são iguais: ${userDebug.verificationToken === token}`);
      } else {
        console.log('⚠️  [DEBUG] Usuário NÃO EXISTE com email: ${decoded.email}');
      }
      
      return res.status(400).json({ message: 'Token inválido ou já utilizado' });
    }

    if (user.emailVerified) {
      console.log('ℹ️ [VERIFY-EMAIL] Email já verificado anteriormente');
      return res.status(200).json({ message: 'Email já verificado anteriormente', alreadyVerified: true });
    }

    // Update user email verification status
    await User.update(
      { 
        emailVerified: true,
        verificationToken: null // Clear token after use
      }, 
      { where: { id: user.id } }
    );
    
    console.log(`✅ [VERIFY-EMAIL] Email verificado com sucesso para user: ${user.email}`);

    res.json({ 
      message: 'Email verificado com sucesso! Você já pode fazer login.',
      success: true
    });
  } catch (error) {
    console.error('❌ [VERIFY-EMAIL] Erro:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Link expirado. Solicite um novo email de verificação.' });
    }
    res.status(400).json({ message: 'Erro ao verificar email' });
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
