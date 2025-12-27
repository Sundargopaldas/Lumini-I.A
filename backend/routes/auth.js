const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const auth = require('../middleware/auth');

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
    res.status(500).json({ message: 'Server error: ' + error.message });
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

    res.json({ token, user: { id: user.id, username: user.username, email: user.email, plan: user.plan } });
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
      attributes: ['id', 'username', 'email', 'plan']
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

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
         const transporter = nodemailer.createTransport({
           service: 'gmail',
           auth: {
             user: process.env.EMAIL_USER,
             pass: process.env.EMAIL_PASS,
           },
         });
 
         const mailOptions = {
          from: `"Lumini I.A Support" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Redefinição de Senha - Lumini I.A',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Redefinição de Senha</h2>
              <p>Você solicitou a redefinição de sua senha na plataforma Lumini I.A.</p>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Redefinir Senha</a>
              <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
              <p>${resetLink}</p>
              <p>Este link expira em 1 hora.</p>
              <p>Se você não solicitou esta alteração, ignore este email.</p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[SUCCESS] Email enviado para ${email}`);
        return res.json({ message: 'Um email com as instruções foi enviado para você.' });

      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
        // Fallback para desenvolvimento se o email falhar (opcional, pode ser removido em prod)
        return res.status(500).json({ message: 'Erro ao enviar email: ' + emailError.message, devLink: resetLink });
      }
    } else {
       // Modo de desenvolvimento sem email configurado
       console.log('[DEV] Email não configurado. Retornando link diretamente.');
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

module.exports = router;
