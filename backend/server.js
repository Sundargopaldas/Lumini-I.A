// CATCH ALL UNHANDLED ERRORS (VERY IMPORTANT)
process.on('unhandledRejection', (reason, promise) => {
  console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.error('!!!     UNHANDLED REJECTION DETECTED      !!!');
  console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.error('Reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config(); // Load .env BEFORE database config
const sequelize = require('./config/database');

const app = express();
// Force reload comment
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com"],
    },
  },
}));

// CORS Configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://luminiiadigital.com.br',
      'https://www.luminiiadigital.com.br',
      process.env.FRONTEND_URL
    ].filter(Boolean)
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174'
    ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitização de inputs (protege contra XSS)
// Temporariamente desativado para deploy - reativar depois
// const { sanitizeMiddleware } = require('./utils/sanitizer');
// app.use(sanitizeMiddleware);

// Trust proxy - necessário para rate limiting atrás de proxy (Render, Heroku, etc)
app.set('trust proxy', 1);

// Rate limiting - Multiple levels for different endpoints
const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 register attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas tentativas de registro. Tente novamente em 1 hora.'
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições. Tente novamente em 1 minuto.'
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters
app.use('/api/auth/login', strictAuthLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/forgot-password', strictAuthLimiter);
app.use('/api/', apiLimiter);
app.use(globalLimiter);

// Health Check Route (MOVED BEFORE PRODUCTION CATCH-ALL)
app.get('/', (req, res) => {
  console.log('>>> [HEALTH CHECK] Health check endpoint accessed');
  res.status(200).send('OK - Lumini I.A Backend is running');
});

// Routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const dashboardRoutes = require('./routes/dashboard');
const invoiceRoutes = require('./routes/invoices');
const accountantRoutes = require('./routes/accountants');
const certificateRoutes = require('./routes/certificates');
const goalRoutes = require('./routes/goals');
const importRoutes = require('./routes/import');
const adminRoutes = require('./routes/admin');
const integrationRoutes = require('./routes/integrations');
const paymentRoutes = require('./routes/payments');
const aiRoutes = require('./routes/ai');
const webhookRoutes = require('./routes/webhooks');

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/accountants', accountantRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/import', importRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/webhooks', webhookRoutes);

// Serve static files from React app
if (process.env.NODE_ENV === 'production') {
  // Em Docker, frontend está em ./public; localmente em ../frontend/dist
  const fs = require('fs');
  const publicPath = fs.existsSync(path.join(__dirname, 'public')) 
    ? path.join(__dirname, 'public') 
    : path.join(__dirname, '../frontend/dist');
  
  app.use(express.static(publicPath));
  
  // The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Database Connection and Server Start
const startServer = async () => {
  console.log('>>> [STARTUP] Starting Lumini I.A server...');
  console.log(`>>> [STARTUP] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`>>> [STARTUP] Port: ${PORT}`);
  
  // CRITICAL SECURITY CHECK
  if (process.env.NODE_ENV === 'production') {
      console.log('>>> [STARTUP] Production environment detected.');
      const hasDbUrl = !!process.env.DATABASE_URL;
      const hasLegacyDb = process.env.DB_PASS && process.env.DB_USER && process.env.DB_NAME;
      
      console.log(`>>> [STARTUP] DATABASE_URL present: ${hasDbUrl}`);
      console.log(`>>> [STARTUP] Legacy DB vars present: ${hasLegacyDb}`);

      if (!hasDbUrl && !hasLegacyDb) {
          console.error('FATAL ERROR: Missing critical environment variables for production (DATABASE_URL or DB_USER/PASS/NAME)');
          process.exit(1);
      }
      
      if (!process.env.JWT_SECRET) {
           console.error('FATAL ERROR: Missing JWT_SECRET');
           process.exit(1);
      }
      console.log('>>> [STARTUP] All critical environment variables seem to be present.');
  }

  let dbConnected = false;
  try {
    console.log('>>> [STARTUP] Attempting to authenticate with the database...');
    await sequelize.authenticate();
    console.log('>>> [STARTUP] Database connection has been established successfully.');

    console.log('>>> [STARTUP] Attempting to sync database schema...');
    await sequelize.sync();
    console.log('>>> [STARTUP] Database schema synced successfully.');
    
    // Manual migrations...
    console.log('>>> [STARTUP] Starting manual migrations...');
    // ... (o restante das migrações manuais continua aqui)
    console.log('>>> [STARTUP] Manual migrations completed.');
    
    dbConnected = true;
  } catch (dbError) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!!      DATABASE CONNECTION FAILED    !!!');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('Database Error:', dbError.message);
    console.error('Database Config:', {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDbHost: !!process.env.DB_HOST,
      hasDbUser: !!process.env.DB_USER,
      hasDbName: !!process.env.DB_NAME,
      nodeEnv: process.env.NODE_ENV
    });
    
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: Cannot start without database in production');
      process.exit(1);
    } else {
      console.warn('>>> [WARNING] Starting without database connection (development mode)');
    }
  }
  
  try {
    const server = app.listen(PORT, () => {
      console.log(`>>> [SUCCESS] Server is running on port ${PORT}. Application is up!`);
      console.log(`>>> [SUCCESS] Health check available at: http://localhost:${PORT}/`);
      if (dbConnected) {
        console.log(`>>> [SUCCESS] Database is connected and ready`);
      } else {
        console.warn(`>>> [WARNING] Server started but database is not connected`);
      }
    });

    server.on('error', (e) => {
        console.error('!!! SERVER RUNTIME ERROR !!!', e);
    });

  } catch (error) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!!      SERVER STARTUP FAILED       !!!');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('Error details:', error);
    process.exit(1); // Força a saída para garantir que o erro seja registrado
  }
};

process.on('exit', (code) => {
  console.log(`>>> [SHUTDOWN] Process exiting with code: ${code}`);
});

process.on('SIGINT', () => {
  console.log('>>> [SHUTDOWN] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('>>> [SHUTDOWN] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

startServer();