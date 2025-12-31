const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sequelize = require('./config/database');
require('dotenv').config();

const app = express();
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
  max: 300, // Limit each IP to 300 requests per windowMs
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

// Rate Limiting - Auth (Stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 login/register attempts per windowMs
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

app.get('/', (req, res) => {
  res.send('Lumini I.A Backend is running');
});

// Database Connection and Server Start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync models with database (alter: true updates tables without dropping)
    // Note: Since you have existing tables, be careful with sync. 
    // 'alter: true' tries to match the model to the table.
    await sequelize.sync();
    
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

