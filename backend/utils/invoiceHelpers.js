const INVOICE_PREFIX = 'INV-HTF-';

function normalizeStatus(status) {
  if (status === 'Unpaid') return 'Pending';
  return status || 'Draft';
}

function isOpenStatus(status) {
  const s = normalizeStatus(status);
  return s === 'Sent' || s === 'Pending' || s === 'Overdue';
}

function applyOverdue(invoice) {
  const obj = typeof invoice.toObject === 'function' ? invoice.toObject() : { ...invoice };
  obj.status = normalizeStatus(obj.status);

  if (
    (obj.status === 'Sent' || obj.status === 'Pending') &&
    obj.dueDate &&
    new Date(obj.dueDate) < new Date(new Date().toDateString())
  ) {
    obj.status = 'Overdue';
  }

  if (obj.status === 'Paid') {
    obj.amountPaid = obj.amountPaid ?? obj.totalAmount ?? 0;
    obj.balanceDue = 0;
  } else if (obj.balanceDue == null) {
    obj.balanceDue = Math.max(0, (obj.totalAmount || 0) - (obj.amountPaid || 0));
  }

  if (!obj.billTo || !obj.billTo.companyName) {
    obj.billTo = {
      companyName: obj.customClientName || obj.client?.companyName || '',
      contactPerson: obj.client?.contactPerson || obj.billTo?.contactPerson || '',
      email: obj.client?.email || obj.billTo?.email || '',
      phone: obj.client?.phone || obj.billTo?.phone || '',
      address: obj.client?.address || obj.billTo?.address || '',
      gstin: obj.billTo?.gstin || '',
    };
  }

  return obj;
}

function computeLineAmount(item) {
  const qty = Number(item.qty) || 0;
  const rate = Number(item.rate) || 0;
  const discount = Number(item.discount) || 0;
  const taxPercent = Number(item.taxPercent) || 0;
  const base = Math.max(0, qty * rate - discount);
  const tax = base * (taxPercent / 100);
  return Math.round((base + tax) * 100) / 100;
}

function computeTotals(items = [], amountPaid = 0, billingPercent = 100) {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  const normalizedItems = items.map((item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const discount = Number(item.discount) || 0;
    const taxPercent = Number(item.taxPercent) || 0;
    const lineBase = Math.max(0, qty * rate);
    const afterDiscount = Math.max(0, lineBase - discount);
    const tax = afterDiscount * (taxPercent / 100);
    const amount = Math.round((afterDiscount + tax) * 100) / 100;

    subtotal += lineBase;
    discountTotal += discount;
    taxTotal += tax;

    return {
      description: item.description || '',
      qty,
      rate,
      discount,
      taxPercent,
      amount,
    };
  });

  const grossTotal = Math.round((subtotal - discountTotal + taxTotal) * 100) / 100;
  const percent = Math.min(100, Math.max(0, Number(billingPercent) || 100));
  const totalAmount = Math.round((grossTotal * percent) / 100 * 100) / 100;
  const paid = Number(amountPaid) || 0;
  const balanceDue = Math.max(0, Math.round((totalAmount - paid) * 100) / 100);

  return {
    items: normalizedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    grossTotal,
    billingPercent: percent,
    totalAmount,
    amountPaid: paid,
    balanceDue,
  };
}

function sanitizeInvoicePayload(body) {
  const data = { ...body };
  if (!data.client || data.client === '' || !require('mongoose').Types.ObjectId.isValid(data.client)) {
    delete data.client;
  }

  if (data.status === 'Unpaid') data.status = 'Pending';

  if (Array.isArray(data.items)) {
    const totals = computeTotals(data.items, data.amountPaid, data.billingPercent);
    Object.assign(data, totals);
  }

  if (data.status === 'Paid') {
    data.amountPaid = data.totalAmount || 0;
    data.balanceDue = 0;
  }

  if (!data.customClientName && data.billTo?.companyName) {
    data.customClientName = data.billTo.companyName;
  }

  return data;
}

async function getNextInvoiceNumber(Invoice) {
  const latest = await Invoice.find({ invoiceNumber: new RegExp(`^${INVOICE_PREFIX}`) })
    .sort({ createdAt: -1 })
    .limit(50)
    .select('invoiceNumber');

  let max = 0;
  latest.forEach((inv) => {
    const suffix = String(inv.invoiceNumber || '').replace(INVOICE_PREFIX, '');
    const num = parseInt(suffix, 10);
    if (!Number.isNaN(num) && num > max) max = num;
  });

  const next = String(max + 1).padStart(4, '0');
  return `${INVOICE_PREFIX}${next}`;
}

function buildInvoiceStats(invoices) {
  let totalRevenue = 0;
  let paidAmount = 0;
  let pendingAmount = 0;
  let overdueAmount = 0;

  invoices.forEach((raw) => {
    const inv = applyOverdue(raw);
    const amount = inv.totalAmount || 0;
    totalRevenue += amount;
    if (inv.status === 'Paid') paidAmount += amount;
    else if (inv.status === 'Overdue') overdueAmount += amount;
    else if (inv.status === 'Cancelled' || inv.status === 'Draft') {
      /* exclude from pending */
    } else pendingAmount += amount;
  });

  return { totalRevenue, paidAmount, pendingAmount, overdueAmount };
}

module.exports = {
  INVOICE_PREFIX,
  normalizeStatus,
  isOpenStatus,
  applyOverdue,
  computeLineAmount,
  computeTotals,
  sanitizeInvoicePayload,
  getNextInvoiceNumber,
  buildInvoiceStats,
};
