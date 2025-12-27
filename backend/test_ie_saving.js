const sequelize = require('./config/database');
const Invoice = require('./models/Invoice');
const User = require('./models/User');

async function testInvoiceCreation() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Find a user to associate the invoice with
    const user = await User.findOne();
    if (!user) {
      console.log('No user found to test with.');
      return;
    }

    console.log('Testing with user:', user.id);

    // Create a test invoice
    const testIE = '123.456.789.000';
    const invoice = await Invoice.create({
      userId: user.id,
      clientName: 'Test Client IE',
      clientDocument: '000.000.000-00',
      clientStateRegistration: testIE,
      clientEmail: 'test@example.com',
      clientAddress: 'Test Address',
      serviceDescription: 'Test Service',
      amount: 100.00,
      status: 'issued',
      issueDate: new Date()
    });

    console.log('Invoice created with ID:', invoice.id);
    console.log('Saved IE:', invoice.clientStateRegistration);

    // Fetch it back to be sure
    const fetchedInvoice = await Invoice.findByPk(invoice.id);
    console.log('Fetched IE from DB:', fetchedInvoice.clientStateRegistration);

    if (fetchedInvoice.clientStateRegistration === testIE) {
      console.log('SUCCESS: IE saved correctly.');
    } else {
      console.log('FAILURE: IE not saved correctly.');
    }

    // Clean up
    await fetchedInvoice.destroy();
    console.log('Test invoice deleted.');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await sequelize.close();
  }
}

testInvoiceCreation();
