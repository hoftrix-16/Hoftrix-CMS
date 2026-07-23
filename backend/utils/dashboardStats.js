const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getLast12MonthsBuckets() {
  const now = new Date();
  const buckets = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: MONTHS[date.getMonth()],
      year: date.getFullYear(),
      month: date.getMonth(),
      income: 0,
      expense: 0,
      leads: 0,
    });
  }

  return buckets;
}

function bucketIndex(buckets, dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return -1;
  return buckets.findIndex(
    (bucket) => bucket.year === date.getFullYear() && bucket.month === date.getMonth()
  );
}

function aggregateFinanceByMonth(records) {
  const buckets = getLast12MonthsBuckets();

  records.forEach((record) => {
    const index = bucketIndex(buckets, record.date || record.createdAt);
    if (index === -1) return;
    if (record.type === 'Income') buckets[index].income += record.amount || 0;
    if (record.type === 'Expense') buckets[index].expense += record.amount || 0;
  });

  return buckets;
}

function aggregateLeadsByMonth(leads) {
  const buckets = getLast12MonthsBuckets();

  leads.forEach((lead) => {
    const index = bucketIndex(buckets, lead.createdAt);
    if (index === -1) return;
    buckets[index].leads += 1;
  });

  return buckets;
}

async function buildFinanceDashboard(Finance, Invoice) {
  const financeRecords = await Finance.find().sort({ date: -1 });
  const paidInvoices = await Invoice.find({ status: 'Paid' });
  const pendingInvoices = await Invoice.find({ status: { $in: ['Unpaid', 'Pending', 'Sent', 'Overdue'] } });

  const invoiceIncome = paidInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
  const financeIncome = financeRecords
    .filter((record) => record.type === 'Income')
    .reduce((sum, record) => sum + (record.amount || 0), 0);
  const totalIncome = financeIncome + invoiceIncome;

  const totalExpense = financeRecords
    .filter((record) => record.type === 'Expense')
    .reduce((sum, record) => sum + (record.amount || 0), 0);

  const pendingAmount = pendingInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
  const monthlyBuckets = aggregateFinanceByMonth(financeRecords);

  paidInvoices.forEach((invoice) => {
    const index = bucketIndex(monthlyBuckets, invoice.invoiceDate || invoice.createdAt);
    if (index !== -1) monthlyBuckets[index].income += invoice.totalAmount || 0;
  });

  const categoryTotals = {};
  financeRecords
    .filter((record) => record.type === 'Income')
    .forEach((record) => {
      const key = record.category || 'General';
      categoryTotals[key] = (categoryTotals[key] || 0) + (record.amount || 0);
    });

  paidInvoices.forEach((invoice) => {
    const key = invoice.subject || 'Invoices';
    categoryTotals[key] = (categoryTotals[key] || 0) + (invoice.totalAmount || 0);
  });

  const transactions = [
    ...financeRecords.slice(0, 12).map((record) => ({
      id: record._id,
      name: record.category || record.reference || 'Finance Entry',
      description: record.reference || record.type,
      amount: record.amount,
      date: record.date || record.createdAt,
      status: record.type === 'Income' ? 'Cr.' : 'Dr.',
    })),
    ...paidInvoices.slice(0, 8).map((invoice) => ({
      id: invoice._id,
      name: invoice.invoiceNumber,
      description: invoice.subject || 'Paid Invoice',
      amount: invoice.totalAmount,
      date: invoice.invoiceDate || invoice.createdAt,
      status: 'Cr.',
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return {
    stats: {
      totalIncome,
      totalExpense,
      profit: totalIncome - totalExpense,
      pendingAmount,
    },
    chart: {
      labels: monthlyBuckets.map((bucket) => bucket.label),
      income: monthlyBuckets.map((bucket) => Math.round(bucket.income)),
      expense: monthlyBuckets.map((bucket) => Math.round(bucket.expense)),
    },
    revenueByCategory: Object.entries(categoryTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6),
    transactions,
  };
}

async function buildSalesDashboard(Lead, Invoice, Client) {
  const leads = await Lead.find().sort({ createdAt: -1 });
  const invoices = await Invoice.find().populate('client', 'companyName contactPerson email').sort({ createdAt: -1 });
  const totalClients = await Client.countDocuments();

  const pipeline = ['New', 'Contacted', 'Interested', 'Closed', 'Lost'].map((status) => ({
    status,
    count: leads.filter((lead) => lead.status === status).length,
  }));

  const monthlyBuckets = aggregateLeadsByMonth(leads);
  const paidRevenue = invoices
    .filter((invoice) => invoice.status === 'Paid')
    .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

  const recentInvoices = invoices.slice(0, 8).map((invoice) => ({
    id: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    clientName: invoice.billTo?.companyName || invoice.client?.companyName || invoice.customClientName || 'Client',
    amount: invoice.totalAmount,
    status: invoice.status === 'Unpaid' ? 'Pending' : invoice.status,
    date: invoice.invoiceDate || invoice.createdAt,
  }));

  const clientTotals = {};
  invoices
    .filter((invoice) => invoice.status === 'Paid')
    .forEach((invoice) => {
      const name = invoice.client?.companyName || invoice.customClientName || 'Unknown';
      clientTotals[name] = (clientTotals[name] || 0) + (invoice.totalAmount || 0);
    });

  return {
    stats: {
      totalLeads: leads.length,
      closedDeals: leads.filter((lead) => lead.status === 'Closed').length,
      totalClients,
      paidRevenue,
    },
    pipeline,
    chart: {
      labels: monthlyBuckets.map((bucket) => bucket.label),
      leads: monthlyBuckets.map((bucket) => bucket.leads),
    },
    recentInvoices,
    topClients: Object.entries(clientTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5),
  };
}

async function buildAnalyticsDashboard(Project, Lead, ActivityLog, Finance, Invoice, Client) {
  const totalProjects = await Project.countDocuments();
  const activeProjects = await Project.countDocuments({ status: { $in: ['In Progress', 'Testing', 'Planning'] } });
  const pendingInvoices = await Invoice.countDocuments({ status: { $in: ['Unpaid', 'Pending', 'Sent', 'Overdue'] } });
  const totalLeads = await Lead.countDocuments();
  const activeClients = Client ? await Client.countDocuments({ status: 'Active' }) : 0;

  const financeRecords = await Finance.find();
  const paidInvoices = await Invoice.find({ status: 'Paid' });
  const financeIncome = financeRecords
    .filter((record) => record.type === 'Income')
    .reduce((sum, record) => sum + (record.amount || 0), 0);
  const invoiceIncome = paidInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
  const totalRevenue = financeIncome + invoiceIncome;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyPaid = paidInvoices
    .filter((inv) => new Date(inv.invoiceDate || inv.createdAt) >= monthStart)
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const monthlyFinance = financeRecords
    .filter((r) => r.type === 'Income' && new Date(r.date || r.createdAt) >= monthStart)
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  const monthlyRevenue = monthlyPaid + monthlyFinance;

  const projectsByStatus = ['Planning', 'In Progress', 'Testing', 'Completed', 'On Hold'].map((status) => ({
    status,
    count: 0,
  }));

  const projects = await Project.find();
  projects.forEach((project) => {
    const entry = projectsByStatus.find((item) => item.status === project.status);
    if (entry) entry.count += 1;
  });

  const leads = await Lead.find();
  const leadPipeline = ['New', 'Contacted', 'Interested', 'Closed', 'Lost'].map((status) => ({
    status,
    count: leads.filter((lead) => lead.status === status).length,
  }));

  const recentActivity = await ActivityLog.find().sort({ createdAt: -1 }).limit(8);

  const upcomingDeadlines = projects
    .filter((p) => p.deadline && p.status !== 'Completed')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 6)
    .map((p) => ({
      id: p._id,
      title: p.name,
      deadline: p.deadline,
      status: p.status,
      progress: p.progress,
    }));

  let upcomingFollowUps = [];
  if (Client) {
    const clients = await Client.find({ 'followUps.status': 'Pending' }).select('companyName followUps');
    clients.forEach((client) => {
      (client.followUps || [])
        .filter((fu) => fu.status === 'Pending')
        .forEach((fu) => {
          upcomingFollowUps.push({
            id: fu._id,
            clientId: client._id,
            companyName: client.companyName,
            title: fu.title,
            dueDate: fu.dueDate,
          });
        });
    });
    upcomingFollowUps.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
    upcomingFollowUps = upcomingFollowUps.slice(0, 6);
  }

  return {
    totalProjects,
    activeProjects,
    pendingInvoices,
    totalRevenue,
    totalLeads,
    activeClients,
    monthlyRevenue,
    projectsByStatus,
    leadPipeline,
    recentActivity,
    upcomingDeadlines,
    upcomingFollowUps,
  };
}

module.exports = {
  buildFinanceDashboard,
  buildSalesDashboard,
  buildAnalyticsDashboard,
};
