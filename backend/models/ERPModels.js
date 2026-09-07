const mongoose = require('mongoose');

// --- CLIENT (CRM) SCHEMA ---
const ClientSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactPerson: { type: String },
  email: { type: String },
  phone: { type: String },
  website: { type: String },
  industry: { type: String, default: 'General' },
  address: { type: String },
  logoUrl: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive', 'Prospect'], default: 'Active' },
  servicesPurchased: [{ type: String }],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  assignedToName: { type: String, default: '' },
  source: { type: String, default: '' },
  notes: [{
    text: String,
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
  }],
  followUps: [{
    title: String,
    dueDate: Date,
    status: { type: String, enum: ['Pending', 'Done'], default: 'Pending' },
    note: String,
    createdAt: { type: Date, default: Date.now },
  }],
  timeline: [{
    type: { type: String, required: true }, // e.g. 'Proposal Sent', 'Payment Received'
    title: { type: String, required: true },
    description: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    createdBy: { type: String, default: 'System' },
  }],
  documents: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
});

// --- PROPOSAL SCHEMA ---
const ProposalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  clientName: { type: String, default: '' },
  services: [{ type: String }],
  amount: { type: Number, default: 0 },
  currency: { type: String, enum: ['USD', 'INR'], default: 'INR' },
  status: { type: String, enum: ['Draft', 'Sent', 'Accepted', 'Rejected'], default: 'Draft' },
  validUntil: { type: Date },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

// --- CONTRACT SCHEMA ---
const ContractSchema = new mongoose.Schema({
  title: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  clientName: { type: String, default: '' },
  value: { type: Number, default: 0 },
  currency: { type: String, enum: ['USD', 'INR'], default: 'INR' },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['Draft', 'Signed', 'Active', 'Expired', 'Terminated'], default: 'Draft' },
  fileUrl: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const DEFAULT_INVOICE_TERMS = `1. Payment should be completed within 15 days of invoice generation.
2. Project timeline depends on client approvals.
3. Any additional requirements will be charged separately.`;

const DEFAULT_INVOICE_NOTES = 'Thank you for choosing Hoftrix Technologies Pvt Ltd.';

// --- COMPANY SETTINGS (singleton branding for invoices) ---
const CompanySettingsSchema = new mongoose.Schema({
  legalName: { type: String, default: 'Hoftrix Technologies Pvt Ltd' },
  brandName: { type: String, default: 'Hoftrix Technologies' },
  address: { type: String, default: 'Mohali, Punjab, India' },
  email: { type: String, default: 'finance@hoftrix.com' },
  phone: { type: String, default: '+91 7889356866' },
  website: { type: String, default: 'www.hoftrix.com' },
  gstin: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  logoSize: { type: Number, default: 72 },
  accentColor: { type: String, default: '#FF4D00' },
  signatureUrl: { type: String, default: '' },
  authorizedName: { type: String, default: 'Ashu Sharma' },
  authorizedDesignation: { type: String, default: 'Founder' },
  bankName: { type: String, default: 'IndusInd Bank' },
  bankAccountName: { type: String, default: 'Hoftrix Technologies Pvt Ltd' },
  bankAccountNumber: { type: String, default: '201036328915' },
  bankSwift: { type: String, default: 'INDBINBB' },
  bankIfsc: { type: String, default: 'INDB0000254' },
  bankAddress: {
    type: String,
    default: 'IndusInd Bank, Daon Branch, Shop No. 2 Green Enclave, Chandigarh-Kharar Road, Village Daon, Mohali - 140301',
  },
  defaultTerms: { type: String, default: DEFAULT_INVOICE_TERMS },
  defaultNotes: { type: String, default: DEFAULT_INVOICE_NOTES },
  updatedAt: { type: Date, default: Date.now },
});

// --- INVOICE SCHEMA ---
const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  customClientName: { type: String },
  billTo: {
    companyName: { type: String, default: '' },
    contactPerson: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    gstin: { type: String, default: '' },
  },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  subject: { type: String },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  terms: { type: String, default: DEFAULT_INVOICE_TERMS },
  notes: { type: String, default: DEFAULT_INVOICE_NOTES },
  items: [{
    description: String,
    qty: { type: Number, default: 1 },
    rate: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  }],
  subtotal: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  grossTotal: { type: Number, default: 0 },
  billingPercent: { type: Number, default: 100 },
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  currency: { type: String, enum: ['USD', 'INR'], default: 'INR' },
  // Unpaid kept for legacy docs; normalized to Pending on read
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Pending', 'Paid', 'Overdue', 'Cancelled', 'Unpaid'],
    default: 'Draft',
  },
  signatureUrl: { type: String },
  authorizedName: { type: String, default: 'Ashu Sharma' },
  authorizedDesignation: { type: String, default: 'Founder' },
  logoUrl: { type: String, default: '' },
  logoSize: { type: Number, default: 72 },
  themeAccent: { type: String, default: '#FF4D00' },
  createdAt: { type: Date, default: Date.now },
});

// --- PROJECT SCHEMA ---
const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  customClientName: { type: String },
  technology: { type: String },
  clientWebsite: { type: String },
  clientPhone: { type: String },
  clientEmail: { type: String },
  description: { type: String },
  status: { type: String, enum: ['Planning', 'In Progress', 'Testing', 'Completed', 'On Hold'], default: 'Planning' },
  deadline: { type: Date },
  budget: { type: Number },
  progress: { type: Number, default: 0 },
  tasks: [{
    title: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    assignedToName: { type: String },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
  }],
  createdAt: { type: Date, default: Date.now }
});

// --- LEAD SCHEMA ---
const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  source: { type: String }, // e.g., Website, Referral
  status: { type: String, enum: ['New', 'Contacted', 'Interested', 'Closed', 'Lost'], default: 'New' },
  notes: { type: String },
  convertedClient: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  createdAt: { type: Date, default: Date.now }
});

// --- EMPLOYEE SCHEMA ---
const EmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  alternatePhone: { type: String },
  designation: { type: String, required: true },
  department: { type: String },
  joiningDate: { type: Date, default: Date.now },
  dob: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  aadharNumber: { type: String },
  panNumber: { type: String },
  address: { type: String },
  salary: { type: Number },
  status: { type: String, enum: ['Active', 'On Leave', 'Terminated'], default: 'Active' },
  avatar: { type: String, default: '' },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifscCode: String
  },
  emergencyContact: {
    name: String,
    phone: String
  },
  documents: [{
    name: String, // e.g. Resume, ID Proof
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  leaves: [{
    type: { type: String, enum: ['Sick', 'Casual', 'Earned', 'Unpaid'] },
    startDate: Date,
    endDate: Date,
    reason: String,
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
  }],
  payroll: [{
    month: String, // e.g. "May 2026"
    amount: Number,
    status: { type: String, enum: ['Pending', 'Paid'], default: 'Paid' },
    transactionId: String,
    paidAt: { type: Date, default: Date.now }
  }],
  attendance: [{
    date: { type: String }, // "YYYY-MM-DD"
    clockIn: { type: Date },
    clockOut: { type: Date },
    duration: { type: Number }, // hours
    status: { type: String, enum: ['Present', 'Absent', 'Late'], default: 'Present' }
  }],
  timeLogs: [{
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    projectName: { type: String },
    taskDescription: { type: String },
    duration: { type: Number }, // hours
    date: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

// --- FINANCE SCHEMA ---
const FinanceSchema = new mongoose.Schema({
  type: { type: String, enum: ['Income', 'Expense'], required: true },
  amount: { type: Number, required: true },
  category: { type: String },
  reference: { type: String }, // e.g., Invoice Number
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// --- ACTIVITY LOG SCHEMA ---
const ActivityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  action: { type: String, required: true }, // e.g. "Invoice Created"
  details: { type: String }, // e.g. "Invoice #INV-001 has been generated"
  type: { type: String, enum: ['success', 'info', 'warning', 'danger'], default: 'info' },
  createdAt: { type: Date, default: Date.now }
});

// --- COMPANY HOLIDAY SCHEMA ---
const HolidaySchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  endDate: { type: Date },
  type: { type: String, enum: ['Public', 'Company', 'Optional'], default: 'Company' },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Client = mongoose.model('Client', ClientSchema);
const Proposal = mongoose.model('Proposal', ProposalSchema);
const Contract = mongoose.model('Contract', ContractSchema);
const Invoice = mongoose.model('Invoice', InvoiceSchema);
const CompanySettings = mongoose.model('CompanySettings', CompanySettingsSchema);
const Project = mongoose.model('Project', ProjectSchema);
const Finance = mongoose.model('Finance', FinanceSchema);
const Lead = mongoose.model('Lead', LeadSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);
const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
const Holiday = mongoose.model('Holiday', HolidaySchema);

module.exports = {
  Client,
  Proposal,
  Contract,
  Invoice,
  CompanySettings,
  Project,
  Finance,
  Lead,
  Employee,
  ActivityLog,
  Holiday,
  DEFAULT_INVOICE_TERMS,
  DEFAULT_INVOICE_NOTES,
};
