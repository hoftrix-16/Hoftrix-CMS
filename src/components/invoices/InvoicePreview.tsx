import type { CompanySettings } from '@/types/invoice'
import type { InvoicePreviewModel } from '@/helpers/invoiceCompany'
import { resolveCompany } from '@/helpers/invoiceCompany'
import { formatMoney } from '@/helpers/invoiceCalc'

interface Props {
  invoice: InvoicePreviewModel
  companySettings?: CompanySettings | null
  id?: string
  /** Scale preview for tablet/mobile (disable for PDF capture) */
  scaled?: boolean
}

const InvoicePreview = ({ invoice, companySettings, id = 'invoice-a4-preview', scaled = true }: Props) => {
  const company = resolveCompany(companySettings)
  const accent = invoice.themeAccent || company.accentColor || '#FF4D00'
  const logoUrl = invoice.logoUrl || company.logoUrl
  const logoSize = invoice.logoSize || company.logoSize || 72
  const authName = invoice.authorizedName || company.authorizedName
  const authTitle = invoice.authorizedDesignation || company.authorizedDesignation
  const currency = invoice.currency || 'INR'

  const paper = (
    <div
      id={id}
      className="invoice-a4-paper"
      style={{
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        background: '#fff',
        color: '#111827',
        padding: '18mm 16mm',
        boxSizing: 'border-box',
        fontFamily: 'Montserrat, Arial, sans-serif',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ height: logoSize, maxWidth: 180, objectFit: 'contain' }} />
          ) : (
            <div style={{ fontSize: 22, fontWeight: 800, color: accent, letterSpacing: 0.5 }}>
              {company.brandName}
            </div>
          )}
          <div style={{ marginTop: 10, fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: '#111827' }}>{company.legalName}</div>
            <div>{company.address}</div>
            <div>{company.email} · {company.phone}</div>
            <div>{company.website}</div>
            {company.gstin && <div>GSTIN: {company.gstin}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: accent, letterSpacing: 1 }}>INVOICE</div>
          <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.7, color: '#374151' }}>
            <div><strong>Invoice #:</strong> {invoice.invoiceNumber || '—'}</div>
            <div><strong>Date:</strong> {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : '—'}</div>
            <div><strong>Due:</strong> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</div>
            <div>
              <strong>Status:</strong>{' '}
              <span style={{ color: invoice.status === 'Paid' ? '#059669' : accent, fontWeight: 700 }}>
                {invoice.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${accent}, transparent)`,
          marginBottom: 24,
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#9ca3af', textTransform: 'uppercase' }}>
            Bill To
          </div>
          <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700 }}>{invoice.billTo.companyName || '—'}</div>
          {invoice.billTo.contactPerson && <div style={{ fontSize: 12 }}>{invoice.billTo.contactPerson}</div>}
          {invoice.billTo.email && <div style={{ fontSize: 12, color: '#4b5563' }}>{invoice.billTo.email}</div>}
          {invoice.billTo.phone && <div style={{ fontSize: 12, color: '#4b5563' }}>{invoice.billTo.phone}</div>}
          {invoice.billTo.address && <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>{invoice.billTo.address}</div>}
          {invoice.billTo.gstin && <div style={{ fontSize: 12, color: '#4b5563' }}>GSTIN: {invoice.billTo.gstin}</div>}
        </div>
        {invoice.subject && (
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#9ca3af', textTransform: 'uppercase' }}>
              Subject
            </div>
            <div style={{ marginTop: 6, fontSize: 13 }}>{invoice.subject}</div>
          </div>
        )}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            {['#', 'Description', 'Qty', 'Rate', 'Discount', 'Tax %', 'Amount'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '10px 8px',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                  color: '#6b7280',
                  borderBottom: `2px solid ${accent}`,
                  textAlign: h === 'Description' || h === '#' ? 'left' : 'right',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(invoice.items || []).length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
                No line items yet
              </td>
            </tr>
          ) : (
            invoice.items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: '12px 8px', fontSize: 12, borderBottom: '1px solid #e5e7eb' }}>{idx + 1}</td>
                <td style={{ padding: '12px 8px', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>
                  {item.description || '—'}
                </td>
                <td style={{ padding: '12px 8px', fontSize: 12, textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                  {item.qty}
                </td>
                <td style={{ padding: '12px 8px', fontSize: 12, textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                  {formatMoney(item.rate, currency)}
                </td>
                <td style={{ padding: '12px 8px', fontSize: 12, textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                  {formatMoney(item.discount, currency)}
                </td>
                <td style={{ padding: '12px 8px', fontSize: 12, textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                  {item.taxPercent || 0}%
                </td>
                <td style={{ padding: '12px 8px', fontSize: 12, fontWeight: 700, textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                  {formatMoney(item.amount, currency)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
        <table style={{ width: 260, borderCollapse: 'collapse' }}>
          {[
            ['Subtotal', invoice.subtotal],
            ['Discount', invoice.discountTotal],
            ['Tax', invoice.taxTotal],
          ].map(([label, value]) => (
            <tr key={String(label)}>
              <td style={{ padding: '6px 0', fontSize: 12, color: '#6b7280' }}>{label}</td>
              <td style={{ padding: '6px 0', fontSize: 12, textAlign: 'right', fontWeight: 600 }}>
                {formatMoney(Number(value), currency)}
              </td>
            </tr>
          ))}
          {(invoice.billingPercent != null && invoice.billingPercent < 100) && (
            <>
              <tr>
                <td style={{ padding: '6px 0', fontSize: 12, color: '#6b7280' }}>Full Amount</td>
                <td style={{ padding: '6px 0', fontSize: 12, textAlign: 'right', fontWeight: 600 }}>
                  {formatMoney(invoice.grossTotal ?? invoice.subtotal, currency)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', fontSize: 12, color: '#6b7280' }}>This Invoice</td>
                <td style={{ padding: '6px 0', fontSize: 12, textAlign: 'right', fontWeight: 700, color: accent }}>
                  {invoice.billingPercent}%
                </td>
              </tr>
            </>
          )}
          <tr>
            <td style={{ padding: '10px 0', fontSize: 14, fontWeight: 800, color: accent, borderTop: '2px solid #e5e7eb' }}>
              Total Due
            </td>
            <td style={{ padding: '10px 0', fontSize: 14, fontWeight: 800, textAlign: 'right', color: accent, borderTop: '2px solid #e5e7eb' }}>
              {formatMoney(invoice.totalAmount, currency)}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '6px 0', fontSize: 12, color: '#6b7280' }}>Amount Paid</td>
            <td style={{ padding: '6px 0', fontSize: 12, textAlign: 'right', fontWeight: 600 }}>
              {formatMoney(invoice.amountPaid, currency)}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '6px 0', fontSize: 13, fontWeight: 700 }}>Balance Due</td>
            <td style={{ padding: '6px 0', fontSize: 13, textAlign: 'right', fontWeight: 800 }}>
              {formatMoney(invoice.balanceDue, currency)}
            </td>
          </tr>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32, marginTop: 40 }}>
        <div style={{ flex: 1, fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>
          {(company.bankAccountNumber || company.bankName) && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f9fafb', borderRadius: 8, borderLeft: `3px solid ${accent}` }}>
              <div style={{ fontWeight: 700, color: '#111827', marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Payment Information
              </div>
              <div style={{ marginBottom: 4 }}>Payments should be made to the following account:</div>
              <div><strong>Name:</strong> {company.bankAccountName}</div>
              <div><strong>Bank:</strong> {company.bankName}</div>
              <div><strong>Account Number:</strong> {company.bankAccountNumber}</div>
              {company.bankSwift && <div><strong>Swift Number:</strong> {company.bankSwift}</div>}
              {company.bankIfsc && <div><strong>IFSC CODE:</strong> {company.bankIfsc}</div>}
              {company.bankAddress && (
                <div style={{ marginTop: 4 }}><strong>Bank Address:</strong> {company.bankAddress}</div>
              )}
            </div>
          )}
          {invoice.notes && (
            <>
              <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>Notes</div>
              <div style={{ whiteSpace: 'pre-wrap', marginBottom: 14 }}>{invoice.notes}</div>
            </>
          )}
          {invoice.terms && (
            <>
              <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>Terms & Conditions</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{invoice.terms}</div>
            </>
          )}
        </div>
        <div style={{ width: 200, textAlign: 'right' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>
            Authorized Signature
          </div>
          {invoice.signatureUrl ? (
            <img
              src={invoice.signatureUrl}
              alt="Signature"
              style={{ maxWidth: 160, maxHeight: 64, objectFit: 'contain', marginLeft: 'auto', display: 'block' }}
            />
          ) : (
            <div style={{ height: 48 }} />
          )}
          <div style={{ borderTop: '1px solid #d1d5db', marginTop: 8, paddingTop: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{authName}</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>{authTitle}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{company.legalName}</div>
          </div>
        </div>
      </div>
    </div>
  )

  if (!scaled) return paper

  return (
    <div className="invoice-preview-frame">
      <div className="invoice-preview-scaler">{paper}</div>
    </div>
  )
}

export default InvoicePreview
