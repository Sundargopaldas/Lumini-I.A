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

// Trust Proxy (Essential for HTTPS behind proxies/load balancers like Ngrok, Vercel, Heroku)
app.enable('trust proxy');

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded by frontend
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://*.stripe.com"], 
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate Limiting - Global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (Increased for dev)
  standardHeaders: true, 
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(globalLimiter);

// Middleware
app.use(cors());

// Webhooks must be before express.json() to allow raw body access
const webhookRoutes = require('./routes/webhooks');
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Models to ensure they are registered
require('./models/User');
require('./models/Category');
require('./models/Transaction');
require('./models/Goal');
require('./models/Integration');
require('./models/Invoice');
require('./models/Certificate');
require('./models/Accountant');
require('./models/SystemConfig');

// Routes Placeholder
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const dashboardRoutes = require('./routes/dashboard');
const integrationRoutes = require('./routes/integrations');
const goalRoutes = require('./routes/goals');
// webhookRoutes imported earlier
const paymentRoutes = require('./routes/payments');
const invoiceRoutes = require('./routes/invoices');
const certificateRoutes = require('./routes/certificates');
const aiRoutes = require('./routes/ai');
const importRoutes = require('./routes/import');
const accountantRoutes = require('./routes/accountants');
const adminRoutes = require('./routes/admin');

// Rate Limiting - Auth (Stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 login/register attempts per windowMs (Increased for dev/testing)
  message: 'Too many login attempts, please try again later'
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/goals', goalRoutes);
// app.use('/api/webhooks', webhookRoutes); // Moved up
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/import', importRoutes);
app.use('/api/accountants', accountantRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Route for Railway
app.get('/healthcheck', (req, res) => {
  res.status(200).send('OK');
});

// --- SERVE FRONTEND IN PRODUCTION ---
if (process.env.NODE_ENV === 'production') {
  // Simple "OK" for the root path to pass health checks
  app.get('/', (req, res) => {
    res.send('Lumini I.A Backend is running');
  });

  // Set static folder
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // Any other route loads the index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Lumini I.A Backend is running (Dev Mode)');
  });
}

// Database Connection and Server Start
const startServer = async () => {
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

    const server = app.listen(PORT, () => {
      console.log(`>>> [SUCCESS] Server is running on port ${PORT}. Application is up!`);
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
    console.log(`Process exiting with code: ${code}`);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT. Exiting...');
    process.exit();
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

startServer();

