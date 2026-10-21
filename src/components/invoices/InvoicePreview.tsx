
import type { CompanySettings } from '@/types/invoice'
import type { InvoicePreviewModel } from '@/helpers/invoiceCompany'
import { resolveCompany } from '@/helpers/invoiceCompany'
import { formatMoney } from '@/helpers/invoiceCalc'

interface Props {
  invoice: InvoicePreviewModel
  companySettings?: CompanySettings | null
  id?: string
  scaled?: boolean
  receivedDate?: string | Date | null
}

const formatDate = (value?: string | Date | null) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const InvoicePreview = ({
  invoice,
  companySettings,
  id = 'invoice-a4-preview',
  scaled = true,
  receivedDate,
}: Props) => {
  const company = resolveCompany(companySettings)
  const accent = invoice.themeAccent || company.accentColor || '#FF4D00'
  const logoUrl = invoice.logoUrl || company.logoUrl
  const logoSize = invoice.logoSize || company.logoSize || 72
  const authName = invoice.authorizedName || company.authorizedName
  const authTitle =
    invoice.authorizedDesignation || company.authorizedDesignation
  const currency = invoice.currency || 'INR'

  const createdAtFallback = (
    invoice as InvoicePreviewModel & { createdAt?: string | Date | null }
  ).createdAt

  const actualReceivedDate = receivedDate ?? createdAtFallback

  const cellStyle: React.CSSProperties = {
    padding: '12px 6px',
    fontSize: 11,
    borderBottom: '1px solid #e5e7eb',
    verticalAlign: 'top',
    overflowWrap: 'anywhere',
  }

  const paper = (
    <div
      id={id}
      className="invoice-a4-paper"
      style={{
        width: '210mm',
        minHeight: '297mm',
        height: 'auto',
        margin: '0 auto',
        background: '#fff',
        color: '#111827',
        padding: '18mm 16mm',
        boxSizing: 'border-box',
        fontFamily: 'Montserrat, Arial, sans-serif',
        position: 'relative',
        flexShrink: 0,
        overflow: 'visible',
      }}
    >
      {/* Company Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 20,
          marginBottom: 28,
        }}
      >
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              style={{
                display: 'block',
                width: 'auto',
                height: 'auto',
                maxWidth: 180,
                maxHeight: logoSize,
                objectFit: 'contain',
                objectPosition: 'left center',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: accent,
                letterSpacing: 0.5,
                overflowWrap: 'anywhere',
              }}
            >
              {company.brandName}
            </div>
          )}

          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: '#6b7280',
              lineHeight: 1.6,
              overflowWrap: 'anywhere',
            }}
          >
            <div style={{ fontWeight: 700, color: '#111827' }}>
              {company.legalName}
            </div>
            <div>{company.address}</div>
            <div>
              {company.email}
              {company.email && company.phone ? ' · ' : ''}
              {company.phone}
            </div>
            <div>{company.website}</div>
            {company.gstin && <div>GSTIN: {company.gstin}</div>}
          </div>
        </div>

        <div style={{ flex: '0 0 auto', textAlign: 'right' }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: accent,
              letterSpacing: 1,
            }}
          >
            INVOICE
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              lineHeight: 1.8,
              color: '#374151',
            }}
          >
            <div>
              <strong>Invoice #:</strong> {invoice.invoiceNumber || '—'}
            </div>
            <div>
              <strong>Invoice Date:</strong>{' '}
              {formatDate(invoice.invoiceDate)}
            </div>
            <div>
              <strong>Received Date:</strong>{' '}
              {formatDate(actualReceivedDate)}
            </div>
            <div>
              <strong>Due Date:</strong> {formatDate(invoice.dueDate)}
            </div>
            <div>
              <strong>Status:</strong>{' '}
              <span
                style={{
                  color: invoice.status === 'Paid' ? '#059669' : accent,
                  fontWeight: 700,
                }}
              >
                {invoice.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Accent Divider */}
      <div
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${accent}, transparent)`,
          marginBottom: 24,
        }}
      />

      {/* Bill To */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 24,
          marginBottom: 28,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              color: '#9ca3af',
              textTransform: 'uppercase',
            }}
          >
            Bill To
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 15,
              fontWeight: 700,
              overflowWrap: 'anywhere',
            }}
          >
            {invoice.billTo.companyName || '—'}
          </div>

          {invoice.billTo.contactPerson && (
            <div style={{ fontSize: 12 }}>
              {invoice.billTo.contactPerson}
            </div>
          )}

          {invoice.billTo.email && (
            <div style={{ fontSize: 12, color: '#4b5563' }}>
              {invoice.billTo.email}
            </div>
          )}

          {invoice.billTo.phone && (
            <div style={{ fontSize: 12, color: '#4b5563' }}>
              {invoice.billTo.phone}
            </div>
          )}

          {invoice.billTo.address && (
            <div
              style={{
                fontSize: 12,
                color: '#4b5563',
                marginTop: 4,
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
              }}
            >
              {invoice.billTo.address}
            </div>
          )}

          {invoice.billTo.gstin && (
            <div style={{ fontSize: 12, color: '#4b5563' }}>
              GSTIN: {invoice.billTo.gstin}
            </div>
          )}
        </div>

        {invoice.subject && (
          <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1,
                color: '#9ca3af',
                textTransform: 'uppercase',
              }}
            >
              Subject
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                overflowWrap: 'anywhere',
              }}
            >
              {invoice.subject}
            </div>
          </div>
        )}
      </div>

      {/* Invoice Items */}
      <table
        style={{
          width: '100%',
          tableLayout: 'fixed',
          borderCollapse: 'collapse',
          marginBottom: 20,
        }}
      >
        <colgroup>
          <col style={{ width: '5%' }} />
          <col style={{ width: '31%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '19%' }} />
        </colgroup>

        <thead>
          <tr style={{ background: '#f9fafb' }}>
            {[
              '#',
              'Description',
              'Qty',
              'Rate',
              'Discount',
              'Tax %',
              'Amount',
            ].map((heading) => (
              <th
                key={heading}
                style={{
                  padding: '10px 5px',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: 0.2,
                  color: '#6b7280',
                  borderBottom: `2px solid ${accent}`,
                  textAlign:
                    heading === 'Description' || heading === '#'
                      ? 'left'
                      : 'right',
                  overflowWrap: 'anywhere',
                }}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {(invoice.items || []).length === 0 ? (
            <tr>
              <td
                colSpan={7}
                style={{
                  padding: 16,
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: 12,
                }}
              >
                No line items yet
              </td>
            </tr>
          ) : (
            invoice.items.map((item, index) => (
              <tr key={index}>
                <td style={cellStyle}>{index + 1}</td>
                <td
                  style={{
                    ...cellStyle,
                    fontWeight: 600,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {item.description || '—'}
                </td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>
                  {item.qty}
                </td>
                <td
                  style={{
                    ...cellStyle,
                    textAlign: 'right',
                  }}
                >
                  {formatMoney(item.rate, currency)}
                </td>
                <td
                  style={{
                    ...cellStyle,
                    textAlign: 'right',
                  }}
                >
                  {formatMoney(item.discount, currency)}
                </td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>
                  {item.taxPercent || 0}%
                </td>
                <td
                  style={{
                    ...cellStyle,
                    fontWeight: 700,
                    textAlign: 'right',
                  }}
                >
                  {formatMoney(item.amount, currency)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 28,
        }}
      >
        <table
          style={{
            width: 260,
            maxWidth: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <tbody>
            {[
              ['Subtotal', invoice.subtotal],
              ['Discount', invoice.discountTotal],
              ['Tax', invoice.taxTotal],
            ].map(([label, value]) => (
              <tr key={String(label)}>
                <td
                  style={{
                    padding: '6px 0',
                    fontSize: 12,
                    color: '#6b7280',
                  }}
                >
                  {label}
                </td>
                <td
                  style={{
                    padding: '6px 0',
                    fontSize: 12,
                    textAlign: 'right',
                    fontWeight: 600,
                  }}
                >
                  {formatMoney(Number(value), currency)}
                </td>
              </tr>
            ))}

            {invoice.billingPercent != null &&
              invoice.billingPercent < 100 && (
                <>
                  <tr>
                    <td
                      style={{
                        padding: '6px 0',
                        fontSize: 12,
                        color: '#6b7280',
                      }}
                    >
                      Full Amount
                    </td>
                    <td
                      style={{
                        padding: '6px 0',
                        fontSize: 12,
                        textAlign: 'right',
                        fontWeight: 600,
                      }}
                    >
                      {formatMoney(
                        invoice.grossTotal ?? invoice.subtotal,
                        currency,
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '6px 0',
                        fontSize: 12,
                        color: '#6b7280',
                      }}
                    >
                      This Invoice
                    </td>
                    <td
                      style={{
                        padding: '6px 0',
                        fontSize: 12,
                        textAlign: 'right',
                        fontWeight: 700,
                        color: accent,
                      }}
                    >
                      {invoice.billingPercent}%
                    </td>
                  </tr>
                </>
              )}

            <tr>
              <td
                style={{
                  padding: '10px 0',
                  fontSize: 14,
                  fontWeight: 800,
                  color: accent,
                  borderTop: '2px solid #e5e7eb',
                }}
              >
                Total Due
              </td>
              <td
                style={{
                  padding: '10px 0',
                  fontSize: 14,
                  fontWeight: 800,
                  textAlign: 'right',
                  color: accent,
                  borderTop: '2px solid #e5e7eb',
                }}
              >
                {formatMoney(invoice.totalAmount, currency)}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '6px 0',
                  fontSize: 12,
                  color: '#6b7280',
                }}
              >
                Amount Paid
              </td>
              <td
                style={{
                  padding: '6px 0',
                  fontSize: 12,
                  textAlign: 'right',
                  fontWeight: 600,
                }}
              >
                {formatMoney(invoice.amountPaid, currency)}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '6px 0',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Balance Due
              </td>
              <td
                style={{
                  padding: '6px 0',
                  fontSize: 13,
                  textAlign: 'right',
                  fontWeight: 800,
                }}
              >
                {formatMoney(invoice.balanceDue, currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Information, Notes and Signature */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 32,
          marginTop: 40,
        }}
      >
        <div
          style={{
            flex: '1 1 0',
            minWidth: 0,
            fontSize: 11,
            color: '#6b7280',
            lineHeight: 1.6,
            overflowWrap: 'anywhere',
          }}
        >
          {(company.bankAccountNumber || company.bankName) && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                background: '#f9fafb',
                borderRadius: 8,
                borderLeft: `3px solid ${accent}`,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: 6,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Payment Information
              </div>
              <div style={{ marginBottom: 4 }}>
                Payments should be made to the following account:
              </div>
              <div>
                <strong>Name:</strong> {company.bankAccountName}
              </div>
              <div>
                <strong>Bank:</strong> {company.bankName}
              </div>
              <div>
                <strong>Account Number:</strong>{' '}
                {company.bankAccountNumber}
              </div>
              {company.bankSwift && (
                <div>
                  <strong>Swift Number:</strong> {company.bankSwift}
                </div>
              )}
              {company.bankIfsc && (
                <div>
                  <strong>IFSC CODE:</strong> {company.bankIfsc}
                </div>
              )}
              {company.bankAddress && (
                <div style={{ marginTop: 4 }}>
                  <strong>Bank Address:</strong> {company.bankAddress}
                </div>
              )}
            </div>
          )}

          {invoice.notes && (
            <div style={{ marginBottom: 14, whiteSpace: 'pre-wrap' }}>
              <div
                style={{
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: 4,
                }}
              >
                Notes
              </div>
              {invoice.notes}
            </div>
          )}

          {invoice.terms && (
            <div style={{ whiteSpace: 'pre-wrap' }}>
              <div
                style={{
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: 4,
                }}
              >
                Terms &amp; Conditions
              </div>
              {invoice.terms}
            </div>
          )}
        </div>

        <div
          style={{
            flex: '0 0 200px',
            maxWidth: 200,
            textAlign: 'right',
            overflowWrap: 'anywhere',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              color: '#9ca3af',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Authorized Signature
          </div>

          {invoice.signatureUrl ? (
            <img
              src={invoice.signatureUrl}
              alt="Signature"
              style={{
                display: 'block',
                width: 'auto',
                height: 'auto',
                maxWidth: 160,
                maxHeight: 64,
                objectFit: 'contain',
                marginLeft: 'auto',
              }}
            />
          ) : (
            <div style={{ height: 48 }} />
          )}

          <div
            style={{
              borderTop: '1px solid #d1d5db',
              marginTop: 8,
              paddingTop: 8,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              {authName}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>
              {authTitle}
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>
              {company.legalName}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (!scaled) return paper

  return (
    <div
      className="invoice-preview-frame"
      style={{
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <div className="invoice-preview-scaler">
        {paper}
      </div>
    </div>
  )
}

export default InvoicePreview
