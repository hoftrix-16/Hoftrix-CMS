const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const { Project, Invoice, Finance, Lead, Employee, ActivityLog, Holiday, Client, Proposal, Contract, CompanySettings } = require('../models/ERPModels');
const Service = require('../models/Service');
const { logActivity } = require('../utils/logger');
const User = require('../models/User');
const { getDefaultEmployeePassword } = require('../utils/passwords');
const { authenticate, adminOnly } = require('../middleware/auth');
const { erpAccessControl } = require('../middleware/permissions');
const { assertEmployeeOwnerOrAdmin, findEmployeeByUserEmail } = require('../middleware/employeeAccess');
const { getDefaultAvatar } = require('../utils/avatar');
const {
  buildFinanceDashboard,
  buildSalesDashboard,
  buildAnalyticsDashboard,
} = require('../utils/dashboardStats');
const {
  applyOverdue,
  sanitizeInvoicePayload,
  getNextInvoiceNumber,
  buildInvoiceStats,
} = require('../utils/invoiceHelpers');
const fs = require('fs');

const getPublicBaseUrl = (req) => process.env.API_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;

// --- MULTER SETUP FOR SIGNATURES / LOGOS ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '') || '.png';
    const prefix = file.fieldname === 'logo' ? 'logo-' : 'sig-';
    cb(null, prefix + Date.now() + ext);
  }
});
const upload = multer({ storage });

router.use(authenticate);
router.use(erpAccessControl);

// --- DASHBOARD STATS ---
router.get('/dashboard-stats', async (req, res) => {
  try {
    const data = await buildAnalyticsDashboard(Project, Lead, ActivityLog, Finance, Invoice, Client);
    res.json({
      totalProjects: data.totalProjects,
      activeProjects: data.activeProjects,
      pendingInvoices: data.pendingInvoices,
      totalRevenue: data.totalRevenue,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/dashboard/finance', async (req, res) => {
  try {
    const data = await buildFinanceDashboard(Finance, Invoice);
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/dashboard/sales', async (req, res) => {
  try {
    const data = await buildSalesDashboard(Lead, Invoice, Client);
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/dashboard/analytics', async (req, res) => {
  try {
    const data = await buildAnalyticsDashboard(Project, Lead, ActivityLog, Finance, Invoice, Client);
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- FINANCE / BALANCE SHEET ---
router.get('/finance/balance-sheet', async (req, res) => {
  try {
    const income = await Finance.find({ type: 'Income' });
    const expenses = await Finance.find({ type: 'Expense' });
    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
    res.json({ totalIncome, totalExpense, profit: totalIncome - totalExpense, records: { income, expenses } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/finance', async (req, res) => {
  try {
    const newRecord = new Finance(req.body);
    await newRecord.save();
    
    // Log Activity
    await logActivity(
      req.body.userId || null,
      req.body.userName || 'System',
      'Financial Entry',
      `Manual ${newRecord.type} of $${newRecord.amount} recorded under category "${newRecord.category || 'General'}"`,
      newRecord.type === 'Income' ? 'success' : 'danger'
    );

    res.status(201).json(newRecord);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/finance/:id', async (req, res) => {
  try {
    const record = await Finance.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- INVOICES ---
router.get('/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('client', 'companyName contactPerson email phone address')
      .populate('project', 'name')
      .sort({ createdAt: -1 });
    const normalized = invoices.map((inv) => applyOverdue(inv));
    const stats = buildInvoiceStats(invoices);
    res.json({ invoices: normalized, stats });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/invoices/next-number', async (req, res) => {
  try {
    const invoiceNumber = await getNextInvoiceNumber(Invoice);
    res.json({ invoiceNumber });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/invoices/stats', async (req, res) => {
  try {
    const invoices = await Invoice.find();
    res.json(buildInvoiceStats(invoices));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'companyName contactPerson email phone address')
      .populate('project', 'name');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(applyOverdue(invoice));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/invoices', async (req, res) => {
  try {
    const invoiceData = sanitizeInvoicePayload(req.body);
    if (!invoiceData.client && !invoiceData.customClientName && !invoiceData.billTo?.companyName) {
      return res.status(400).json({ message: 'Select a client or provide billing details' });
    }

    const newInvoice = new Invoice(invoiceData);
    await newInvoice.save();

    await logActivity(
      req.body.userId || null,
      req.body.userName || 'System',
      'Invoice Created',
      `Invoice #${newInvoice.invoiceNumber} created for ${newInvoice.currency === 'INR' ? '₹' : '$'}${newInvoice.totalAmount}`,
      'info'
    );

    res.status(201).json(applyOverdue(newInvoice));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/invoices/:id', async (req, res) => {
  try {
    const oldInvoice = await Invoice.findById(req.params.id);
    if (!oldInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const invoiceData = sanitizeInvoicePayload(req.body);
    if (invoiceData.client === undefined && (req.body.client === '' || req.body.client == null)) {
      invoiceData.client = null;
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, invoiceData, { new: true });

    if (oldInvoice.status !== 'Paid' && updatedInvoice.status === 'Paid') {
      const financeEntry = new Finance({
        type: 'Income',
        amount: updatedInvoice.totalAmount,
        category: 'Invoice Payment',
        reference: updatedInvoice.invoiceNumber,
        date: new Date()
      });
      await financeEntry.save();

      await logActivity(
        req.body.userId || null,
        req.body.userName || 'System',
        'Invoice Paid',
        `Invoice #${updatedInvoice.invoiceNumber} of ${updatedInvoice.totalAmount} marked as Paid`,
        'success'
      );
    } else {
      await logActivity(
        req.body.userId || null,
        req.body.userName || 'System',
        'Invoice Updated',
        `Invoice #${updatedInvoice.invoiceNumber} details updated (Status: ${updatedInvoice.status})`,
        'info'
      );
    }

    res.json(applyOverdue(updatedInvoice));
  } catch (err) {
    console.error('Update Invoice Error:', err);
    res.status(400).json({ message: err.message });
  }
});

router.post('/invoices/upload-signature', upload.single('signature'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const fileUrl = `${getPublicBaseUrl(req)}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

router.post('/invoices/draw-signature', async (req, res) => {
  try {
    const { dataUrl } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
      return res.status(400).json({ message: 'Invalid signature data' });
    }
    const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ message: 'Invalid data URL' });
    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `sig-draw-${Date.now()}.${ext}`;
    const filepath = path.join('uploads', filename);
    fs.writeFileSync(filepath, buffer);
    const fileUrl = `${getPublicBaseUrl(req)}/uploads/${filename}`;
    res.json({ url: fileUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/invoices/:id', async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Invoice deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- COMPANY SETTINGS ---
async function getOrCreateCompanySettings() {
  let settings = await CompanySettings.findOne();
  if (!settings) {
    settings = await CompanySettings.create({});
  }
  return settings;
}

router.get('/company-settings', async (req, res) => {
  try {
    const settings = await getOrCreateCompanySettings();
    res.json(settings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/company-settings', async (req, res) => {
  try {
    const settings = await getOrCreateCompanySettings();
    Object.assign(settings, req.body, { updatedAt: new Date() });
    await settings.save();
    res.json(settings);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.post('/company-settings/upload-logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const fileUrl = `${getPublicBaseUrl(req)}/uploads/${req.file.filename}`;
    const settings = await getOrCreateCompanySettings();
    settings.logoUrl = fileUrl;
    settings.updatedAt = new Date();
    await settings.save();
    res.json({ url: fileUrl, settings });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- OTHER ROUTES (PROJECTS, LEADS, etc.) ---
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find().populate('client', 'companyName contactPerson email');
    res.json(projects);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/projects', async (req, res) => {
  try {
    const projectData = { ...req.body };
    if (!projectData.client || projectData.client === '') {
      delete projectData.client;
    }
    const newProject = new Project(projectData);
    await newProject.save();
    res.status(201).json(newProject);
  } catch (err) { 
    console.error('🔥 Project Creation Error:', err);
    res.status(400).json({ message: err.message }); 
  }
});

// Update Project (for tasks/progress/status)
router.put('/projects/:id', async (req, res) => {
  try {
    const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('client', 'companyName contactPerson email');
    res.json(updatedProject);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/leads', async (req, res) => {
  try {
    const leads = await Lead.find();
    res.json(leads);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/leads', async (req, res) => {
  try {
    const newLead = new Lead(req.body);
    await newLead.save();

    // Log Activity
    await logActivity(
      req.body.userId || null,
      req.body.userName || 'System',
      'Lead Registered',
      `New CRM Lead "${newLead.name}" registered (Source: ${newLead.source || 'Direct'})`,
      'success'
    );

    res.status(201).json(newLead);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/leads/:id', async (req, res) => {
  try {
    const oldLead = await Lead.findById(req.params.id);
    const updatedLead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedLead) return res.status(404).json({ message: 'Lead not found' });

    // Log Activity if status changed
    if (oldLead && oldLead.status !== updatedLead.status) {
      let type = 'info';
      if (updatedLead.status === 'Closed') type = 'success';
      if (updatedLead.status === 'Lost') type = 'danger';
      await logActivity(
        req.body.userId || null,
        req.body.userName || 'System',
        'Lead Status Changed',
        `Lead "${updatedLead.name}" status updated from "${oldLead.status}" to "${updatedLead.status}"`,
        type
      );
    } else {
      await logActivity(
        req.body.userId || null,
        req.body.userName || 'System',
        'Lead Updated',
        `Lead "${updatedLead.name}" details updated`,
        'info'
      );
    }

    res.json(updatedLead);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/leads/:id', async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json({ message: 'Lead deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- EMPLOYEES ---
router.get('/employees', async (req, res) => {
  try {
    const employees = await Employee.find().lean();
    const emails = employees
      .map((emp) => (emp.email || '').toLowerCase())
      .filter(Boolean);
    const users = await User.find({ email: { $in: emails } }).select('email role');
    
    const roleMap = {};
    users.forEach(u => {
      roleMap[u.email.toLowerCase()] = u.role;
    });

    const updatedEmployees = employees.map(emp => ({
      ...emp,
      role: emp.email ? (roleMap[emp.email.toLowerCase()] || 'employee') : 'employee'
    }));

    res.json(updatedEmployees);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/employees', async (req, res) => {
  try {
    const newEmployee = new Employee(req.body);
    await newEmployee.save();

    // Auto-generate Auth User credential for Employee
    if (newEmployee.email) {
      const existingUser = await User.findOne({ email: newEmployee.email.toLowerCase() });
      if (!existingUser) {
        const defaultPassword = getDefaultEmployeePassword();
        const newUser = new User({
          name: newEmployee.name,
          email: newEmployee.email.toLowerCase(),
          phone: newEmployee.phone || '',
          password: defaultPassword,
          role: 'employee',
          designation: newEmployee.designation || '',
          avatar: newEmployee.avatar || getDefaultAvatar(newEmployee.name)
        });
        await newUser.save();
        console.log(`🔑 Auth User account automatically created for employee ${newEmployee.email} with default password!`);
      }
    }

    // Log Activity
    await logActivity(
      req.body.userId || null,
      req.body.userName || 'System',
      'Employee Registered',
      `New staff member ${newEmployee.name} (${newEmployee.designation}) registered in ${newEmployee.department || 'Operations'}`,
      'success'
    );

    res.status(201).json(newEmployee);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/employees/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (req.user.role !== 'admin') {
      if (!assertEmployeeOwnerOrAdmin(req, res, employee)) return;

      const incomingLeaves = req.body.leaves;
      if (!Array.isArray(incomingLeaves)) {
        return res.status(403).json({ message: 'You can only submit leave updates on your own profile' });
      }

      const existingLeaves = employee.leaves || [];
      if (incomingLeaves.length < existingLeaves.length) {
        return res.status(403).json({ message: 'You cannot remove leave records' });
      }

      for (let i = 0; i < existingLeaves.length; i += 1) {
        const before = existingLeaves[i];
        const after = incomingLeaves[i];
        if (
          before.type !== after.type ||
          String(before.startDate) !== String(after.startDate) ||
          String(before.endDate) !== String(after.endDate) ||
          before.reason !== after.reason ||
          before.status !== after.status
        ) {
          return res.status(403).json({ message: 'You cannot modify existing leave requests' });
        }
      }

      for (let i = existingLeaves.length; i < incomingLeaves.length; i += 1) {
        incomingLeaves[i].status = 'Pending';
      }

      employee.leaves = incomingLeaves;
      await employee.save();

      await logActivity(
        req.user.id,
        req.user.name,
        'Leave Requested',
        `${employee.name} submitted a ${incomingLeaves[incomingLeaves.length - 1]?.type || 'leave'} request`,
        'info'
      );

      return res.json(employee);
    }

    Object.assign(employee, req.body);
    await employee.save();

    await logActivity(
      req.body.userId || req.user.id || null,
      req.body.userName || req.user.name || 'System',
      'Employee Updated',
      `Staff member ${employee.name} details or status updated (Status: ${employee.status})`,
      'info'
    );

    res.json(employee);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.post('/employees/me/leaves', async (req, res) => {
  try {
    if (req.user.role === 'client') {
      return res.status(403).json({ message: 'Clients cannot request leave' });
    }

    const employee = await findEmployeeByUserEmail(req.user.email);
    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found for your account' });
    }

    const { type, startDate, endDate, reason } = req.body;
    if (!type || !startDate || !endDate) {
      return res.status(400).json({ message: 'Leave type, start date, and end date are required' });
    }

    employee.leaves.push({
      type,
      startDate,
      endDate,
      reason: reason || '',
      status: 'Pending',
    });
    await employee.save();

    await logActivity(
      req.user.id,
      req.user.name,
      'Leave Requested',
      `${employee.name} requested ${type} leave`,
      'info'
    );

    res.status(201).json(employee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/employees/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await Employee.findByIdAndDelete(req.params.id);

    // Auto-remove corresponding Auth User account (never delete the acting admin by mistake beyond email match)
    if (employee.email) {
      await User.findOneAndDelete({
        email: employee.email.toLowerCase(),
        role: { $ne: 'admin' },
      });
    }

    await logActivity(
      req.user?.id || null,
      req.user?.name || 'System',
      'Employee Terminated',
      `Staff member ${employee.name} has been deleted/terminated from the ERP`,
      'danger'
    );

    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- GET INTEGRATED CALENDAR EVENTS ---
router.get('/calendar-events', async (req, res) => {
  try {
    const projects = await Project.find();
    const employees = await Employee.find();
    const invoices = await Invoice.find().populate('client', 'companyName');
    const holidays = await Holiday.find().sort({ date: 1 });

    const events = [];

    // 1. Projects Deadlines (Blue)
    projects.forEach(project => {
      if (project.deadline) {
        events.push({
          id: `project-${project._id}`,
          title: `💼 Project Due: ${project.name}`,
          start: project.deadline,
          allDay: true,
          color: '#0d6efd',
          extendedProps: {
            type: 'Project',
            description: project.description || 'No description provided.',
            status: project.status,
            progress: `${project.progress}%`
          }
        });
      }
    });

    // 2. Employee Leaves (Green for Approved, Orange for Pending/Rejected)
    employees.forEach(emp => {
      if (emp.leaves && emp.leaves.length > 0) {
        emp.leaves.forEach(leave => {
          if (leave.startDate && leave.endDate) {
            const isApproved = leave.status === 'Approved';
            events.push({
              id: `leave-${leave._id}`,
              title: `🌴 ${emp.name} Leave (${leave.type})`,
              start: leave.startDate,
              end: leave.endDate,
              allDay: true,
              color: isApproved ? '#198754' : '#ffc107',
              textColor: isApproved ? '#fff' : '#000',
              extendedProps: {
                type: 'Employee Leave',
                employeeName: emp.name,
                designation: emp.designation,
                status: leave.status,
                reason: leave.reason || 'No reason provided.'
              }
            });
          }
        });
      }
    });

    // 3. Invoice Due Dates (Red for Unpaid, Grey for Paid)
    invoices.forEach(inv => {
      if (inv.dueDate) {
        const isPaid = inv.status === 'Paid';
        const clientName = inv.billTo?.companyName || inv.customClientName || inv.client?.companyName || 'Valued Client';
        events.push({
          id: `invoice-${inv._id}`,
          title: `📄 Invoice Due: ${inv.invoiceNumber}`,
          start: inv.dueDate,
          allDay: true,
          color: isPaid ? '#6c757d' : '#dc3545',
          extendedProps: {
            type: 'Invoice Due',
            invoiceNumber: inv.invoiceNumber,
            client: clientName,
            status: inv.status === 'Unpaid' ? 'Pending' : inv.status,
            amount: `${inv.currency === 'INR' ? '₹' : '$'}${(inv.totalAmount || 0).toLocaleString()}`
          }
        });
      }
    });

    // 4. Company / public holidays (Purple)
    holidays.forEach((holiday) => {
      events.push({
        id: `holiday-${holiday._id}`,
        title: `🎉 ${holiday.title}`,
        start: holiday.date,
        end: holiday.endDate || holiday.date,
        allDay: true,
        color: '#6f42c1',
        textColor: '#fff',
        extendedProps: {
          type: 'Company Holiday',
          holidayType: holiday.type,
          description: holiday.description || 'Company holiday',
        },
      });
    });

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- GET EMPLOYEE PROFILE BY EMAIL ---
router.get('/employees/email/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    if (req.user.role !== 'admin' && req.user.email?.toLowerCase() !== email) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const employee = await Employee.findOne({ email });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    res.json(employee);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- CLOCK-IN ATTENDANCE ---
router.post('/employees/:id/clock-in', async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    if (!assertEmployeeOwnerOrAdmin(req, res, emp)) return;

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Allow up to 3 clock-in sessions per day
    const todayEntries = emp.attendance.filter(att => att.date === todayStr);
    if (todayEntries.length >= 3) {
      return res.status(400).json({ message: 'You have reached the maximum of 3 clock-in sessions for today.' });
    }

    const activeAtt = todayEntries.find(att => !att.clockOut);
    if (activeAtt) {
      return res.status(400).json({ message: 'Please clock out from your current session first.' });
    }

    emp.attendance.push({
      date: todayStr,
      clockIn: new Date(),
      status: 'Present'
    });

    await emp.save();

    // Log Activity
    await logActivity(
      null,
      emp.name,
      'Clock-In',
      `${emp.name} clocked in at ${new Date().toLocaleTimeString()}`,
      'success'
    );

    res.json({ message: 'Clock-in successful', employee: emp });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- CLOCK-OUT ATTENDANCE ---
router.post('/employees/:id/clock-out', async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    if (!assertEmployeeOwnerOrAdmin(req, res, emp)) return;

    const todayStr = new Date().toISOString().split('T')[0];
    
    const todayAtt = emp.attendance.find(att => att.date === todayStr && !att.clockOut);
    if (!todayAtt) {
      return res.status(400).json({ message: 'Active clock-in not found for today.' });
    }

    todayAtt.clockOut = new Date();
    const diffMs = todayAtt.clockOut - todayAtt.clockIn;
    todayAtt.duration = Math.round((diffMs / 3600000) * 100) / 100; // in hours

    await emp.save();

    // Log Activity
    await logActivity(
      null,
      emp.name,
      'Clock-Out',
      `${emp.name} clocked out (Worked: ${todayAtt.duration} hrs)`,
      'info'
    );

    res.json({ message: 'Clock-out successful', employee: emp });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- TASK TIME LOGGER ---
router.post('/employees/:id/time-logs', async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    if (!assertEmployeeOwnerOrAdmin(req, res, emp)) return;

    const { project, projectName, taskDescription, duration } = req.body;
    emp.timeLogs.push({
      project: project || null,
      projectName: projectName || 'General Task',
      taskDescription,
      duration
    });

    await emp.save();

    // Log Activity
    await logActivity(
      null,
      emp.name,
      'Task Time Logged',
      `${emp.name} logged ${duration} hrs on "${projectName || 'General Task'}"`,
      'success'
    );

    res.json({ message: 'Task hours logged successfully', employee: emp });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- GET RECENT ACTIVITY LOGS ---
router.get('/activity-logs', async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(20);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- COMPANY HOLIDAYS ---
router.get('/holidays', async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/holidays', adminOnly, async (req, res) => {
  try {
    const { title, date, endDate, type, description } = req.body;
    if (!title || !date) {
      return res.status(400).json({ message: 'Title and date are required' });
    }

    const holiday = new Holiday({ title, date, endDate, type, description });
    await holiday.save();

    await logActivity(
      req.user.id,
      req.user.name,
      'Holiday Added',
      `${title} scheduled on ${new Date(date).toLocaleDateString()}`,
      'success'
    );

    res.status(201).json(holiday);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/holidays/:id', adminOnly, async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) return res.status(404).json({ message: 'Holiday not found' });

    await logActivity(
      req.user.id,
      req.user.name,
      'Holiday Removed',
      `${holiday.title} removed from calendar`,
      'warning'
    );

    res.json({ message: 'Holiday deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- SERVICE CATALOG ---
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/services', async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/services/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/services/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- CRM CLIENTS ---
router.get('/clients', async (req, res) => {
  try {
    const clients = await Client.find().populate('assignedTo', 'name email designation').sort({ createdAt: -1 });
    const enriched = await Promise.all(
      clients.map(async (client) => {
        const [projects, invoices] = await Promise.all([
          Project.find({ client: client._id }),
          Invoice.find({ client: client._id }),
        ]);
        const totalRevenue = invoices
          .filter((inv) => inv.status === 'Paid')
          .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        const pendingInvoices = invoices.filter((inv) => ['Unpaid', 'Pending', 'Sent', 'Overdue'].includes(inv.status)).length;
        const activeProjects = projects.filter((p) => p.status !== 'Completed').length;
        const lastActivity =
          client.timeline?.length > 0
            ? client.timeline[client.timeline.length - 1]
            : null;
        return {
          ...client.toObject(),
          totalRevenue,
          pendingInvoices,
          activeProjects,
          projectCount: projects.length,
          lastActivity,
        };
      })
    );
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/clients/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate('assignedTo', 'name email designation avatar');
    if (!client) return res.status(404).json({ message: 'Client not found' });

    const [projects, invoices, proposals, contracts] = await Promise.all([
      Project.find({ client: client._id }).sort({ createdAt: -1 }),
      Invoice.find({ client: client._id }).sort({ createdAt: -1 }),
      Proposal.find({ client: client._id }).sort({ createdAt: -1 }),
      Contract.find({ client: client._id }).sort({ createdAt: -1 }),
    ]);

    const totalRevenue = invoices
      .filter((inv) => inv.status === 'Paid')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const pendingAmount = invoices
      .filter((inv) => ['Unpaid', 'Pending', 'Sent', 'Overdue'].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    res.json({
      ...client.toObject(),
      projects,
      invoices,
      proposals,
      contracts,
      totalRevenue,
      pendingAmount,
      pendingInvoices: invoices.filter((inv) => ['Unpaid', 'Pending', 'Sent', 'Overdue'].includes(inv.status)).length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/clients', async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.timeline || payload.timeline.length === 0) {
      payload.timeline = [
        {
          type: 'Client Created',
          title: 'Client onboarded',
          description: `${payload.companyName || 'Client'} was added to CRM`,
          createdBy: req.user.name || 'System',
        },
      ];
    }
    const client = new Client(payload);
    await client.save();
    await logActivity(req.user.id, req.user.name, 'Client Created', `Client "${client.companyName}" added`, 'success');
    res.status(201).json(client);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    await logActivity(req.user.id, req.user.name, 'Client Deleted', `Client "${client.companyName}" removed`, 'warning');
    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/clients/:id/notes', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    client.notes.push({
      text: req.body.text,
      createdBy: req.user.name || 'System',
    });
    await client.save();
    res.json(client);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/clients/:id/timeline', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    client.timeline.push({
      type: req.body.type || 'Note',
      title: req.body.title,
      description: req.body.description || '',
      createdBy: req.user.name || 'System',
      date: req.body.date || new Date(),
    });
    await client.save();
    await logActivity(req.user.id, req.user.name, req.body.type || 'CRM Activity', `${req.body.title} — ${client.companyName}`, 'info');
    res.json(client);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/clients/:id/follow-ups', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    client.followUps.push({
      title: req.body.title,
      dueDate: req.body.dueDate,
      note: req.body.note || '',
      status: 'Pending',
    });
    client.timeline.push({
      type: 'Follow-up Scheduled',
      title: req.body.title,
      description: req.body.note || '',
      createdBy: req.user.name || 'System',
    });
    await client.save();
    res.json(client);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/clients/:id/follow-ups/:followUpId', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    const followUp = client.followUps.id(req.params.followUpId);
    if (!followUp) return res.status(404).json({ message: 'Follow-up not found' });
    if (req.body.status) followUp.status = req.body.status;
    if (req.body.title) followUp.title = req.body.title;
    if (req.body.dueDate) followUp.dueDate = req.body.dueDate;
    if (req.body.note !== undefined) followUp.note = req.body.note;
    await client.save();
    res.json(client);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/clients/:id/documents', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    client.documents.push({
      name: req.body.name,
      url: req.body.url,
    });
    await client.save();
    res.json(client);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- FOLLOW UPS (aggregate across clients) ---
router.get('/follow-ups', async (req, res) => {
  try {
    const clients = await Client.find({ 'followUps.0': { $exists: true } }).select('companyName followUps status logoUrl');
    const items = [];
    clients.forEach((client) => {
      (client.followUps || []).forEach((fu) => {
        items.push({
          _id: fu._id,
          clientId: client._id,
          companyName: client.companyName,
          title: fu.title,
          dueDate: fu.dueDate,
          status: fu.status,
          note: fu.note,
          createdAt: fu.createdAt,
        });
      });
    });
    items.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- PROJECT TASKS (aggregate) ---
router.get('/project-tasks', async (req, res) => {
  try {
    const projects = await Project.find().select('name status tasks client customClientName');
    const tasks = [];
    projects.forEach((project) => {
      (project.tasks || []).forEach((task, index) => {
        tasks.push({
          _id: `${project._id}-${index}`,
          projectId: project._id,
          projectName: project.name,
          projectStatus: project.status,
          clientName: project.customClientName || '',
          title: task.title,
          isCompleted: task.isCompleted,
          assignedToName: task.assignedToName,
          priority: task.priority,
        });
      });
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- PROPOSALS ---
router.get('/proposals', async (req, res) => {
  try {
    const proposals = await Proposal.find().populate('client', 'companyName contactPerson email').sort({ createdAt: -1 });
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/proposals', async (req, res) => {
  try {
    const proposal = new Proposal(req.body);
    await proposal.save();
    if (proposal.client) {
      await Client.findByIdAndUpdate(proposal.client, {
        $push: {
          timeline: {
            type: 'Proposal Sent',
            title: proposal.title,
            description: `Proposal worth ${proposal.currency} ${proposal.amount}`,
            createdBy: req.user.name,
          },
        },
      });
    }
    await logActivity(req.user.id, req.user.name, 'Proposal Created', proposal.title, 'info');
    res.status(201).json(proposal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/proposals/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    res.json(proposal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/proposals/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndDelete(req.params.id);
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    res.json({ message: 'Proposal deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- CONTRACTS ---
router.get('/contracts', async (req, res) => {
  try {
    const contracts = await Contract.find().populate('client', 'companyName contactPerson email').sort({ createdAt: -1 });
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/contracts', async (req, res) => {
  try {
    const contract = new Contract(req.body);
    await contract.save();
    if (contract.client) {
      await Client.findByIdAndUpdate(contract.client, {
        $push: {
          timeline: {
            type: 'Contract Created',
            title: contract.title,
            description: `Contract value ${contract.currency} ${contract.value}`,
            createdBy: req.user.name,
          },
        },
      });
    }
    await logActivity(req.user.id, req.user.name, 'Contract Created', contract.title, 'success');
    res.status(201).json(contract);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/contracts/:id', async (req, res) => {
  try {
    const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    res.json(contract);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/contracts/:id', async (req, res) => {
  try {
    const contract = await Contract.findByIdAndDelete(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    res.json({ message: 'Contract deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
