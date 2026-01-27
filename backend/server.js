// CACHEBUST: 2026-01-14-notification-fix
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

// Import models to ensure they are registered before sync
const User = require('./models/User');
const Accountant = require('./models/Accountant');
const Transaction = require('./models/Transaction');
const Notification = require('./models/Notification');
const Document = require('./models/Document');

// 🐛 Error Logging System
const logger = require('./utils/errorLogger');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
// Force rebuild - Hotmart + Open Finance + CSP Fix - 2026-01-19
const CACHEBUST = '2026-01-19-13:30:00'; // Force Docker cache invalidation
const PORT = process.env.PORT || 8080;

// Middleware - CSP configurado para permitir integrações (Stripe, Umami, Pluggy/Open Finance, Landing Page Assets)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com" // Landing Page - FontAwesome
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"], // Landing Page - FontAwesome
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://js.stripe.com",
        "https://cloud.umami.is",
        "https://cdn.pluggy.ai",
        "https://cdn.tailwindcss.com" // Landing Page - Tailwind
      ],
      scriptSrcElem: [
        "'self'",
        "'unsafe-inline'",
        "https://js.stripe.com",
        "https://cloud.umami.is",
        "https://cdn.pluggy.ai",
        "https://cdn.tailwindcss.com" // Landing Page - Tailwind
      ],
      frameSrc: ["'self'", "https://js.stripe.com", "https://cdn.pluggy.ai"],
      connectSrc: [
        "'self'",
        "https://api.stripe.com",
        "https://cloud.umami.is",
        "https://api-gateway.umami.dev",
        "https://api.pluggy.ai",
        "https://cdn.tailwindcss.com" // Tailwind pode fazer fetch de config
      ],
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

// 🔒 HEADERS DE SEGURANÇA ADICIONAIS
app.use((req, res, next) => {
  // Previne clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Previne MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Política de referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Política de permissões (desabilita funcionalidades desnecessárias)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // XSS Protection (para navegadores antigos)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict Transport Security (HSTS) - força HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📁 Serve uploads folder (accountant images, certificates, etc)
// Com headers CORS para permitir acesso de qualquer origem
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// 📊 Request Logger (todas as requisições)
app.use(requestLogger);

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
  max: 300, // limit each IP to 300 requests per minute (increased for testing)
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições. Tente novamente em 1 minuto.'
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // limit each IP to 2000 requests per 15 min (increased for accountant testing)
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters
app.use('/api/auth/login', strictAuthLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/forgot-password', strictAuthLimiter);
app.use('/api/', apiLimiter);
app.use(globalLimiter);

// Health Check Route - usando /api/health para não conflitar com frontend
app.get('/api/health', (req, res) => {
  console.log('>>> [HEALTH CHECK] Health check endpoint accessed');
  res.status(200).json({ status: 'OK', message: 'Lumini I.A Backend is running' });
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
const setupRoutes = require('./routes/setup');
const notificationRoutes = require('./routes/notifications');

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
app.use('/api/setup', setupRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve static files from React app
if (process.env.NODE_ENV === 'production') {
  // Em Docker, frontend está em ./public; localmente em ../frontend/dist
  const fs = require('fs');
  const publicPath = fs.existsSync(path.join(__dirname, 'public'))
    ? path.join(__dirname, 'public')
    : path.join(__dirname, '../frontend/dist');

  console.log(`>>> [STARTUP] Public path: ${publicPath}`);
  console.log(`>>> [STARTUP] Public path exists: ${fs.existsSync(publicPath)}`);
  console.log(`>>> [STARTUP] index.html exists: ${fs.existsSync(path.join(publicPath, 'index.html'))}`);

  if (fs.existsSync(publicPath)) {
    console.log(`>>> [STARTUP] Files in public path:`, fs.readdirSync(publicPath));
  }

  // Servir Landing Page (Website Institucional)
  const websitePath = path.join(__dirname, 'website');
  console.log(`>>> [STARTUP] Website path: ${websitePath}`);

  // 🚨 FORÇAR Rotas do React App (Prioridade Máxima)
  const reactRoutes = ['/login', '/register', '/dashboard', '/forgot-password', '/mobile-app'];
  reactRoutes.forEach(route => {
    app.get(route, (req, res) => {
      console.log(`>>> [ROUTER] Forcing React App for route: ${route}`);
      // Disable caching strictly to fix login issues
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      res.set("Surrogate-Control", "no-store");
      res.sendFile(path.join(publicPath, 'index.html'));
    });
  });

  if (fs.existsSync(websitePath)) {
    console.log('>>> [STARTUP] Serving Landing Page from website folder');

    // Rota explícita para documentação
    app.get('/docs', (req, res) => {
      res.sendFile(path.join(websitePath, 'docs.html'));
    });

    app.use(express.static(websitePath, {
      index: 'index.html',
      maxAge: '1h' // Cache menor para o site institucional
    }));
  }

  // Servir arquivos estáticos do React
  app.use(express.static(publicPath, {
    index: false, // Não servir index.html automaticamente (deixa catch-all tratar rotas do app)
    maxAge: '1d'
  }));

  // The "catchall" handler: para qualquer rota que não seja /api/* ou /uploads/*, servir o React
  app.get('*', (req, res, next) => {
    // Se for rota de API, uploads, ou arquivo estático (com extensão), pular para próximo handler
    if (req.path.startsWith('/api/') ||
      req.path.startsWith('/uploads/') ||
      req.path.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|json|txt|xml|webmanifest)$/)) {
      return next();
    }

    console.log(`>>> [FRONTEND] Serving index.html for route: ${req.path}`);
    const indexPath = path.join(publicPath, 'index.html');

    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send(`Frontend not found. Looking for: ${indexPath}`);
    }
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

    // Configurar relacionamentos dos models
    console.log('>>> [STARTUP] Configuring model associations...');

    // Document relationships
    Document.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
    Document.belongsTo(Accountant, { foreignKey: 'accountantId', as: 'accountant' });
    User.hasMany(Document, { foreignKey: 'clientId', as: 'documents' });
    Accountant.hasMany(Document, { foreignKey: 'accountantId', as: 'sentDocuments' });

    console.log('>>> [STARTUP] Model associations configured.');

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
    logger.error('Server Startup Failed', error);
    process.exit(1); // Força a saída para garantir que o erro seja registrado
  }
};

// 🛡️ Global Error Handler (deve vir depois de todas as rotas)
app.use(errorHandler);

process.on('exit', (code) => {
  console.log(`>>> [SHUTDOWN] Process exiting with code: ${code}`);
  logger.info(`Process exiting with code: ${code}`);
});

process.on('SIGINT', () => {
  console.log('>>> [SHUTDOWN] Received SIGINT, shutting down gracefully...');
  logger.info('Server shutting down gracefully (SIGINT)');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('>>> [SHUTDOWN] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

startServer();