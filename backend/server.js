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

// --- SERVE FRONTEND IN PRODUCTION ---
if (process.env.NODE_ENV === 'production') {
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
      const requiredEnv = ['JWT_SECRET', 'DB_PASS', 'DB_USER', 'DB_NAME'];
      const missing = requiredEnv.filter(key => !process.env[key]);
      if (missing.length > 0) {
          console.error(`FATAL ERROR: Missing critical environment variables for production: ${missing.join(', ')}`);
          process.exit(1);
      }
  }

  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Using sync() to keep schema consistent
    await sequelize.sync();
    
    // Manual migration for Invoice columns (safe add)
    try {
        await sequelize.query("ALTER TABLE Invoices ADD COLUMN taxAmount DECIMAL(10, 2) DEFAULT 0.00;");
        console.log("Added taxAmount column to Invoices table.");
    } catch (e) {
        // Ignore if column exists
    }
    try {
        await sequelize.query("ALTER TABLE Invoices ADD COLUMN clientState VARCHAR(2);");
        console.log("Added clientState column to Invoices table.");
    } catch (e) {
        // Ignore if column exists
    }

    try {
        await sequelize.query("ALTER TABLE Invoices ADD COLUMN type ENUM('official', 'receipt') DEFAULT 'official';");
        console.log("Added type column to Invoices table.");
    } catch (e) {
        // Ignore if column exists
    }
    
    // Manual migration for User Company Fields
    try {
        await sequelize.query("ALTER TABLE Users ADD COLUMN municipalRegistration VARCHAR(255);");
        console.log("Added municipalRegistration to Users.");
    } catch (e) {}
    try {
        await sequelize.query("ALTER TABLE Users ADD COLUMN taxRegime VARCHAR(50) DEFAULT 'Simples Nacional';");
        console.log("Added taxRegime to Users.");
    } catch (e) {}

    // Manual migration for cpfCnpj (safe add)
    try {
        await sequelize.query("ALTER TABLE Users ADD COLUMN cpfCnpj VARCHAR(255);");
        console.log("Added cpfCnpj column to Users table.");
    } catch (err) {
        if (!err.original || err.original.code !== 'ER_DUP_FIELDNAME') {
             // Ignore duplicate column error, log others
             console.log("Note: cpfCnpj column check - " + err.message);
        }
    }

    // Manual migration for NfeStatus (safe add)
    try {
        await sequelize.query("ALTER TABLE Transactions ADD COLUMN nfeStatus ENUM('pending', 'emitted', 'error') DEFAULT 'pending';");
        console.log("Added nfeStatus column to Transactions table.");
    } catch (err) {
        // Ignore if exists
    }

    try {
        await sequelize.query("ALTER TABLE Transactions ADD COLUMN nfeUrl VARCHAR(255);");
        console.log("Added nfeUrl column to Transactions table.");
    } catch (err) {
        // Ignore if exists
    }

    // Manual migration for Logo
    try {
      await sequelize.query("ALTER TABLE Users ADD COLUMN logo VARCHAR(255);");
      console.log("Added logo column to Users table.");
    } catch (err) {
      if (!err.original || err.original.code !== 'ER_DUP_FIELDNAME') {
           console.log("Note: logo column check - " + err.message);
      }
    }

    // Manual migration for fitId (Financial Institution ID)
    try {
      await sequelize.query("ALTER TABLE Transactions ADD COLUMN fitId VARCHAR(255);");
      console.log("Added fitId column to Transactions table.");
    } catch (err) {
      if (!err.original || err.original.code !== 'ER_DUP_FIELDNAME') {
           console.log("Note: fitId column check - " + err.message);
      }
    }

    // Manual migration for accountantId (Link to Accountant)
    try {
      await sequelize.query("ALTER TABLE Users ADD COLUMN accountantId INTEGER REFERENCES Accountants(id);");
      console.log("Added accountantId column to Users table.");
    } catch (err) {
      if (!err.original || err.original.code !== 'ER_DUP_FIELDNAME') {
           console.log("Note: accountantId column check - " + err.message);
      }
    }
    
    console.log('Database synchronized.');

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    server.on('error', (e) => {
        console.error('Server error:', e);
    });

  } catch (error) {
    console.error('Unable to connect to the database:', error);
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

