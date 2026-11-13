const PHONE_REGEX = /^\+[1-9]\d{0,3}-\d{4,14}$/;

function normalizePhone(phone) {
  if (phone === null || phone === undefined) {
    return '';
  }

  const value = String(phone).trim();

  if (!value) {
    return '';
  }

  const canonicalMatch = value.match(/^\+([1-9]\d{0,3})-(\d+)$/);

  if (canonicalMatch) {
    return `+${canonicalMatch[1]}-${canonicalMatch[2]}`;
  }

  const spacedMatch = value.match(/^\+([1-9]\d{0,3})\s+(\d+)$/);

  if (spacedMatch) {
    return `+${spacedMatch[1]}-${spacedMatch[2]}`;
  }

  return value;
}



const INVOICE_PREFIX = 'INV-HTF';

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
  if (data.billTo?.phone) {
  const normalizedPhone = normalizePhone(data.billTo.phone);

  if (!PHONE_REGEX.test(normalizedPhone)) {
    throw new Error('Invalid bill-to phone number');
  }

  data.billTo.phone = normalizedPhone;
}

  return data;
}

async function getNextInvoiceNumber(Invoice, invoiceDate = new Date()) {
  const date =
    invoiceDate && !isNaN(new Date(invoiceDate).getTime())
      ? new Date(invoiceDate)
      : new Date();

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  const monthPrefix = `${INVOICE_PREFIX}-${month}-${year}-`;

  // Match only invoices for this specific month and year (e.g. INV-HTF-11-26-001)
  const escapedPrefix = monthPrefix.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const monthPattern = new RegExp(`^${escapedPrefix}(\\d+)$`);

  const currentMonthInvoices = await Invoice.find({
    invoiceNumber: monthPattern,
  }).select('invoiceNumber');

  let max = 0;

  currentMonthInvoices.forEach((inv) => {
    const match = String(inv.invoiceNumber || '').match(monthPattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!Number.isNaN(num) && num > max) {
        max = num;
      }
    }
  });

  const sequence = String(max + 1).padStart(3, '0');
  return `${monthPrefix}${sequence}`;
}

async function autoFixMisnumberedInvoices(Invoice, ActivityLog, Finance) {
  try {
    const invoices = await Invoice.find({}).sort({ createdAt: 1, _id: 1 });
    if (!invoices || invoices.length === 0) return;

    // Group invoices by month-year prefix, e.g. "INV-HTF-11-26"
    const groups = {};
    for (const inv of invoices) {
      const match = String(inv.invoiceNumber || '').match(/^([A-Za-z0-9_-]+-\d{2}-\d{2})-(\d+)$/);
      if (match) {
        const prefix = match[1];
        if (!groups[prefix]) groups[prefix] = [];
        groups[prefix].push({
          inv,
          seq: parseInt(match[2], 10),
          id: inv._id,
          num: inv.invoiceNumber,
        });
      }
    }

    for (const [prefix, list] of Object.entries(groups)) {
      // If the first invoice in a month does not start from 1 (e.g. starts from 005 due to legacy bug)
      if (list.length > 0 && list[0].seq !== 1) {
        for (let i = 0; i < list.length; i++) {
          const expectedSeq = String(i + 1).padStart(3, '0');
          const expectedNumber = `${prefix}-${expectedSeq}`;
          const item = list[i];
          if (item.num !== expectedNumber) {
            const oldNum = item.num;
            await Invoice.updateOne(
              { _id: item.id },
              { $set: { invoiceNumber: expectedNumber } }
            );

            if (ActivityLog) {
              await ActivityLog.updateMany(
                { description: new RegExp(oldNum, 'i') },
                { $set: { description: `Invoice #${expectedNumber} created` } }
              ).catch(() => {});
            }

            if (Finance) {
              await Finance.updateMany(
                { reference: oldNum },
                { $set: { reference: expectedNumber } }
              ).catch(() => {});
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error auto-fixing misnumbered invoices:', err.stack || err);
  }
}

const INR_TO_USD_RATE = 0.012;

function buildInvoiceStats(invoices) {
  let totalRevenue = 0;
  let paidAmount = 0;
  let pendingAmount = 0;
  let overdueAmount = 0;

  invoices.forEach((raw) => {
    const inv = applyOverdue(raw);

    let amount = Number(inv.totalAmount) || 0;

    // INR → USD
    if (String(inv.currency || 'INR').toUpperCase() === 'INR') {
      amount = amount * INR_TO_USD_RATE;
    }

    // USD already USD
    totalRevenue += amount;

    if (inv.status === 'Paid') {
      paidAmount += amount;
    } else if (inv.status === 'Overdue') {
      overdueAmount += amount;
    } else if (
      inv.status === 'Cancelled' ||
      inv.status === 'Draft'
    ) {
      // exclude
    } else {
      pendingAmount += amount;
    }
  });

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    paidAmount: Math.round(paidAmount * 100) / 100,
    pendingAmount: Math.round(pendingAmount * 100) / 100,
    overdueAmount: Math.round(overdueAmount * 100) / 100,
  };
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
  autoFixMisnumberedInvoices,
  buildInvoiceStats,
};
