import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import type { InvoicePreviewModel } from '@/helpers/invoiceCompany'
import type { CompanySettings } from '@/types/invoice'
import { resolveCompany } from '@/helpers/invoiceCompany'
import { formatMoney } from '@/helpers/invoiceCalc'

/** Print the on-screen A4 preview element */
export async function printInvoiceFromElement(elementId = 'invoice-a4-preview') {
  const el = document.getElementById(elementId)
  if (!el) return

  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) return

  printWindow.document.write(`
    <html>
      <head>
        <title>Invoice</title>
        <style>
          @page { size: A4; margin: 0; }
          body { margin: 0; background: #fff; }
          .invoice-a4-paper { box-shadow: none !important; }
        </style>
      </head>
      <body>${el.outerHTML}</body>
    </html>
  `)
  printWindow.document.close()
  setTimeout(() => {
    printWindow.focus()
    printWindow.print()
  }, 400)
}

/** Download PDF from the A4 preview DOM */
export async function downloadInvoicePdf(elementId = 'invoice-a4-preview', filename = 'invoice.pdf') {
  const el = document.getElementById(elementId)
  if (!el) throw new Error('Invoice preview not found')

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position -= pageHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(filename)
}

/** Fallback HTML print when preview element is not mounted (e.g. list page) */
export function printInvoiceDocument(
  inv: InvoicePreviewModel,
  companySettings?: CompanySettings | null
) {
  const company = resolveCompany(companySettings)
  const accent = inv.themeAccent || company.accentColor
  const currency = inv.currency || 'INR'
  const logoUrl = inv.logoUrl || company.logoUrl
  const logoSize = inv.logoSize || company.logoSize

  const rows = (inv.items || [])
    .map(
      (item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td style="font-weight:600">${item.description || ''}</td>
        <td style="text-align:right">${item.qty}</td>
        <td style="text-align:right">${formatMoney(item.rate, currency)}</td>
        <td style="text-align:right">${formatMoney(item.discount, currency)}</td>
        <td style="text-align:right">${item.taxPercent || 0}%</td>
        <td style="text-align:right;font-weight:600">${formatMoney(item.amount, currency)}</td>
      </tr>`
    )
    .join('')

  const html = `
    <html><head><title>${inv.invoiceNumber}</title>
    <style>
      @page { size: A4; margin: 14mm; }
      body { font-family: Arial, sans-serif; color: #111827; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #f9fafb; font-size: 10px; text-transform: uppercase; padding: 8px; border-bottom: 2px solid ${accent}; text-align: left; }
      td { padding: 10px 8px; font-size: 12px; border-bottom: 1px solid #e5e7eb; }
      .accent { color: ${accent}; }
    </style></head><body>
      <div style="display:flex;justify-content:space-between;margin-bottom:24px">
        <div>
          ${logoUrl ? `<img src="${logoUrl}" style="height:${logoSize}px;max-width:180px;object-fit:contain" />` : `<div class="accent" style="font-size:22px;font-weight:800">${company.brandName}</div>`}
          <div style="font-size:11px;color:#6b7280;margin-top:8px;line-height:1.6">
            <strong style="color:#111">${company.legalName}</strong><br/>
            ${company.address}<br/>${company.email} · ${company.phone}<br/>${company.website}
            ${company.gstin ? `<br/>GSTIN: ${company.gstin}` : ''}
          </div>
        </div>
        <div style="text-align:right">
          <div class="accent" style="font-size:28px;font-weight:800">INVOICE</div>
          <div style="font-size:12px;margin-top:8px;line-height:1.7">
            <strong>#</strong> ${inv.invoiceNumber}<br/>
            <strong>Date:</strong> ${inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '—'}<br/>
            <strong>Due:</strong> ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}<br/>
            <strong>Status:</strong> ${inv.status}
          </div>
        </div>
      </div>
      <div style="margin-bottom:20px">
        <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:700">Bill To</div>
        <div style="font-size:15px;font-weight:700">${inv.billTo?.companyName || '—'}</div>
        <div style="font-size:12px;color:#4b5563">${[inv.billTo?.contactPerson, inv.billTo?.email, inv.billTo?.phone, inv.billTo?.address].filter(Boolean).join(' · ')}</div>
      </div>
      <table>
        <thead><tr>
          <th>#</th><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th>
          <th style="text-align:right">Discount</th><th style="text-align:right">Tax %</th><th style="text-align:right">Amount</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:20px;text-align:right;font-size:12px;line-height:1.8">
        <div>Subtotal: ${formatMoney(inv.subtotal, currency)}</div>
        <div>Discount: ${formatMoney(inv.discountTotal, currency)}</div>
        <div>Tax: ${formatMoney(inv.taxTotal, currency)}</div>
        ${
          inv.billingPercent != null && inv.billingPercent < 100
            ? `<div>Full Amount: ${formatMoney(inv.grossTotal ?? inv.subtotal, currency)}</div>
               <div>This Invoice: ${inv.billingPercent}%</div>`
            : ''
        }
        <div class="accent" style="font-size:16px;font-weight:800">Total Due: ${formatMoney(inv.totalAmount, currency)}</div>
        <div>Paid: ${formatMoney(inv.amountPaid, currency)}</div>
        <div style="font-weight:700">Balance Due: ${formatMoney(inv.balanceDue, currency)}</div>
      </div>
      <div style="margin-top:40px;display:flex;justify-content:space-between">
        <div style="font-size:11px;color:#6b7280;max-width:55%;white-space:pre-wrap">
          ${
            company.bankAccountNumber
              ? `<div style="margin-bottom:14px;padding:10px;background:#f9fafb;border-left:3px solid ${accent}">
                  <strong style="color:#111">Payment Information</strong><br/>
                  Payments should be made to the following account:<br/>
                  <strong>Name:</strong> ${company.bankAccountName}<br/>
                  <strong>Bank:</strong> ${company.bankName}<br/>
                  <strong>Account Number:</strong> ${company.bankAccountNumber}<br/>
                  <strong>Swift Number:</strong> ${company.bankSwift}<br/>
                  <strong>IFSC CODE:</strong> ${company.bankIfsc}<br/>
                  <strong>Bank Address:</strong> ${company.bankAddress}
                </div>`
              : ''
          }
          ${inv.notes ? `<strong style="color:#111">Notes</strong><br/>${inv.notes}<br/><br/>` : ''}
          ${inv.terms ? `<strong style="color:#111">Terms & Conditions</strong><br/>${inv.terms}` : ''}
        </div>
        <div style="text-align:right;font-size:12px">
          ${inv.signatureUrl ? `<img src="${inv.signatureUrl}" style="max-width:140px;max-height:60px;object-fit:contain" /><br/>` : ''}
          <div style="border-top:1px solid #d1d5db;padding-top:6px;margin-top:8px;width:180px;margin-left:auto">
            <strong>${inv.authorizedName || company.authorizedName}</strong><br/>
            ${inv.authorizedDesignation || company.authorizedDesignation}<br/>
            <span style="color:#9ca3af;font-size:10px">${company.legalName}</span>
          </div>
        </div>
      </div>
    </body></html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
  setTimeout(() => w.print(), 500)
}

export function toPreviewModel(inv: any): InvoicePreviewModel {
  return {
    invoiceNumber: inv.invoiceNumber || '',
    invoiceDate: inv.invoiceDate,
    dueDate: inv.dueDate,
    status: inv.status || 'Draft',
    currency: inv.currency || 'INR',
    billTo: inv.billTo || {
      companyName: inv.customClientName || inv.client?.companyName || '',
      contactPerson: inv.client?.contactPerson || '',
      email: inv.client?.email || '',
      phone: inv.client?.phone || '',
      address: inv.client?.address || '',
      gstin: '',
    },
    items: (inv.items || []).map((item: any) => ({
      description: item.description || '',
      qty: item.qty ?? 1,
      rate: item.rate ?? 0,
      discount: item.discount ?? 0,
      taxPercent: item.taxPercent ?? 0,
      amount: item.amount ?? 0,
    })),
    subtotal: inv.subtotal ?? inv.totalAmount ?? 0,
    discountTotal: inv.discountTotal ?? 0,
    taxTotal: inv.taxTotal ?? 0,
    grossTotal: inv.grossTotal ?? inv.subtotal ?? inv.totalAmount ?? 0,
    billingPercent: inv.billingPercent ?? 100,
    totalAmount: inv.totalAmount ?? 0,
    amountPaid: inv.amountPaid ?? (inv.status === 'Paid' ? inv.totalAmount : 0),
    balanceDue: inv.balanceDue ?? (inv.status === 'Paid' ? 0 : inv.totalAmount ?? 0),
    notes: inv.notes,
    terms: inv.terms,
    signatureUrl: inv.signatureUrl,
    authorizedName: inv.authorizedName,
    authorizedDesignation: inv.authorizedDesignation,
    logoUrl: inv.logoUrl,
    logoSize: inv.logoSize,
    themeAccent: inv.themeAccent,
    subject: inv.subject,
  }
}
