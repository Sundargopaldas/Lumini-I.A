const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import Models to ensure they are registered
require('./models/User');
require('./models/Category');
require('./models/Transaction');
require('./models/Goal');
require('./models/Integration');
require('./models/Invoice');
require('./models/Certificate');

// Routes Placeholder
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const dashboardRoutes = require('./routes/dashboard');
const integrationRoutes = require('./routes/integrations');
const goalRoutes = require('./routes/goals');
const webhookRoutes = require('./routes/webhooks');
const paymentRoutes = require('./routes/payments');
const invoiceRoutes = require('./routes/invoices');
const certificateRoutes = require('./routes/certificates');

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/certificates', certificateRoutes);

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
        // Column likely exists
        console.log("Note: cpfCnpj column check - " + err.message);
    }

    console.log('Database synchronized.');

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    
    // Handle errors
    server.on('error', (error) => {
       console.error('Server error:', error);
    });

  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

