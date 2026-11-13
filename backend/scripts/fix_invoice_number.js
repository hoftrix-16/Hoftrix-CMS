const mongoose = require('../node_modules/mongoose');
const path = require('path');
require('../node_modules/dotenv').config({ path: path.join(__dirname, '../.env') });
const { autoFixMisnumberedInvoices } = require('../utils/invoiceHelpers');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hoftrix_db';

async function run() {
  console.log('Connecting to MongoDB at:', uri);
  await mongoose.connect(uri);
  console.log('Connected to MongoDB successfully.');

  const Invoice = mongoose.model(
    'Invoice',
    new mongoose.Schema({}, { strict: false, collection: 'invoices' })
  );
  const ActivityLog = mongoose.model(
    'ActivityLog',
    new mongoose.Schema({}, { strict: false, collection: 'activitylogs' })
  );
  const Finance = mongoose.model(
    'Finance',
    new mongoose.Schema({}, { strict: false, collection: 'finances' })
  );

  const allInvoices = await Invoice.find({}).sort({ createdAt: 1 });
  console.log(`Found ${allInvoices.length} total invoices in database:`);
  for (const inv of allInvoices) {
    console.log({
      id: inv._id.toString(),
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      createdAt: inv.createdAt,
      totalAmount: inv.totalAmount,
      clientName: inv.customClientName || inv.billTo?.companyName,
    });
  }

  await autoFixMisnumberedInvoices(Invoice, ActivityLog, Finance);

  const updatedInvoices = await Invoice.find({}).sort({ createdAt: 1 });
  console.log('Invoices after auto-fix:');
  for (const inv of updatedInvoices) {
    console.log({
      id: inv._id.toString(),
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      createdAt: inv.createdAt,
    });
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
