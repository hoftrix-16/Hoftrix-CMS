'use client'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom'
import { Button, Card, Col, Form, InputGroup, Row, Spinner, Table } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'
import InvoicePreview from '@/components/invoices/InvoicePreview'
import { computeInvoiceTotals } from '@/helpers/invoiceCalc'
import { downloadInvoicePdf, printInvoiceFromElement } from '@/helpers/invoicePrint'
import {
  DEFAULT_NOTES,
  DEFAULT_TERMS,
  INVOICE_PREFIX,
  type CompanySettings,
  type InvoiceBillTo,
  type InvoiceLineItem,
  type InvoiceStatus,
} from '@/types/invoice'

const emptyItem = (): InvoiceLineItem => ({
  description: '',
  qty: 1,
  rate: 0,
  discount: 0,
  taxPercent: 0,
  amount: 0,
})

const emptyBillTo = (): InvoiceBillTo => ({
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  gstin: '',
})

const InvoiceBuilderPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id) && location.pathname.endsWith('/edit')
  const isNew = location.pathname.endsWith('/new') || !id
  const prefillClientId = searchParams.get('clientId') || ''

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [invoiceIdNumber, setInvoiceIdNumber] = useState('')

  const [form, setForm] = useState({
    subject: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'Draft' as InvoiceStatus,
    currency: 'INR' as 'USD' | 'INR',
    billTo: emptyBillTo(),
    items: [emptyItem()],
    notes: DEFAULT_NOTES,
    terms: DEFAULT_TERMS,
    billingPercent: 100,
    amountPaid: 0,
  })

  const baseTotals = computeInvoiceTotals(form.items, 0, form.billingPercent)
  const effectivePaid = form.status === 'Paid' ? baseTotals.totalAmount : form.amountPaid
  const previewTotals = computeInvoiceTotals(form.items, effectivePaid, form.billingPercent)

  // Always use company branding from DB
  const branding = {
    signatureUrl: companySettings?.signatureUrl || '',
    authorizedName: companySettings?.authorizedName || 'Ashu Sharma',
    authorizedDesignation: companySettings?.authorizedDesignation || 'Founder',
    logoUrl: companySettings?.logoUrl || '',
    logoSize: companySettings?.logoSize || 72,
    themeAccent: companySettings?.accentColor || '#FF4D00',
  }

  useEffect(() => {
    const boot = async () => {
      try {
        const [settingsRes, nextRes] = await Promise.all([
          api.get('/erp/company-settings'),
          isNew ? api.get('/erp/invoices/next-number') : Promise.resolve(null),
        ])
        const settings = settingsRes.data
        setCompanySettings(settings)
        setForm((prev) => ({
          ...prev,
          notes: settings.defaultNotes || DEFAULT_NOTES,
          terms: settings.defaultTerms || DEFAULT_TERMS,
        }))

        if (nextRes?.data?.invoiceNumber) {
          const full = nextRes.data.invoiceNumber as string
          setInvoiceIdNumber(full.startsWith(INVOICE_PREFIX) ? full.slice(INVOICE_PREFIX.length) : full)
        }

        // Prefill from client detail page (?clientId=...)
        if (isNew && prefillClientId) {
          try {
            const clientRes = await api.get(`/erp/clients/${prefillClientId}`)
            const c = clientRes.data
            setSelectedClientId(c._id)
            setForm((prev) => ({
              ...prev,
              billTo: {
                companyName: c.companyName || '',
                contactPerson: c.contactPerson || '',
                email: c.email || '',
                phone: c.phone || '',
                address: c.address || '',
                gstin: '',
              },
            }))
          } catch {
            /* ignore prefill errors */
          }
        }

        if (isEdit && id) {
          const res = await api.get(`/erp/invoices/${id}`)
          const inv = res.data
          const full = inv.invoiceNumber || ''
          setInvoiceIdNumber(full.startsWith(INVOICE_PREFIX) ? full.slice(INVOICE_PREFIX.length) : full)
          setSelectedClientId(inv.client?._id || '')
          setForm({
            subject: inv.subject || '',
            invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : '',
            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
            status: (inv.status === 'Unpaid' ? 'Pending' : inv.status) || 'Draft',
            currency: inv.currency || 'INR',
            billTo: inv.billTo?.companyName
              ? inv.billTo
              : {
                  companyName: inv.customClientName || inv.client?.companyName || '',
                  contactPerson: inv.client?.contactPerson || '',
                  email: inv.client?.email || '',
                  phone: inv.client?.phone || '',
                  address: inv.client?.address || '',
                  gstin: inv.billTo?.gstin || '',
                },
            items:
              inv.items?.length > 0
                ? inv.items.map((it: any) => ({
                    description: it.description || '',
                    qty: it.qty ?? 1,
                    rate: it.rate ?? 0,
                    discount: it.discount ?? 0,
                    taxPercent: it.taxPercent ?? 0,
                    amount: it.amount ?? 0,
                  }))
                : [emptyItem()],
            notes: inv.notes || settings.defaultNotes || DEFAULT_NOTES,
            terms: inv.terms || settings.defaultTerms || DEFAULT_TERMS,
            billingPercent: inv.billingPercent ?? 100,
            amountPaid: inv.amountPaid || 0,
          })
        }
      } catch (err) {
        console.error(err)
        toast.error('Failed to load invoice builder')
      } finally {
        setLoading(false)
      }
    }
    boot()
  }, [id, isEdit, isNew, prefillClientId])

  const updateItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    const items = [...form.items]
    const next = { ...items[index], [field]: value }
    next.amount = computeInvoiceTotals([next]).items[0].amount
    items[index] = next
    setForm({ ...form, items })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.billTo.companyName.trim()) {
      toast.error('Enter client / billing company name')
      return
    }
    setSaving(true)
    const computed = computeInvoiceTotals(form.items, form.status === 'Paid' ? 0 : form.amountPaid, form.billingPercent)
    const paidAmount = form.status === 'Paid' ? computed.totalAmount : form.amountPaid
    const payload: any = {
      invoiceNumber: INVOICE_PREFIX + invoiceIdNumber.trim(),
      client: selectedClientId || undefined,
      customClientName: form.billTo.companyName,
      billTo: form.billTo,
      subject: form.subject,
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate || undefined,
      status: form.status,
      currency: form.currency,
      items: computed.items,
      subtotal: computed.subtotal,
      discountTotal: computed.discountTotal,
      taxTotal: computed.taxTotal,
      grossTotal: computed.grossTotal,
      billingPercent: computed.billingPercent,
      totalAmount: computed.totalAmount,
      amountPaid: paidAmount,
      balanceDue: form.status === 'Paid' ? 0 : Math.max(0, computed.totalAmount - paidAmount),
      notes: form.notes,
      terms: form.terms,
      signatureUrl: branding.signatureUrl,
      authorizedName: branding.authorizedName,
      authorizedDesignation: branding.authorizedDesignation,
      logoUrl: branding.logoUrl,
      logoSize: branding.logoSize,
      themeAccent: branding.themeAccent,
    }

    try {
      if (isEdit && id) {
        await api.put(`/erp/invoices/${id}`, payload)
        toast.success('Invoice updated')
        navigate(`/pages/invoices/${id}`)
      } else {
        const res = await api.post('/erp/invoices', payload)
        toast.success('Invoice created')
        navigate(`/pages/invoices/${res.data._id}`)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const previewModel = {
    invoiceNumber: INVOICE_PREFIX + invoiceIdNumber,
    invoiceDate: form.invoiceDate,
    dueDate: form.dueDate,
    status: form.status,
    currency: form.currency,
    billTo: form.billTo,
    items: previewTotals.items,
    subtotal: previewTotals.subtotal,
    discountTotal: previewTotals.discountTotal,
    taxTotal: previewTotals.taxTotal,
    grossTotal: previewTotals.grossTotal,
    billingPercent: previewTotals.billingPercent,
    totalAmount: previewTotals.totalAmount,
    amountPaid: previewTotals.amountPaid,
    balanceDue: previewTotals.balanceDue,
    notes: form.notes,
    terms: form.terms,
    signatureUrl: branding.signatureUrl,
    authorizedName: branding.authorizedName,
    authorizedDesignation: branding.authorizedDesignation,
    logoUrl: branding.logoUrl,
    logoSize: branding.logoSize,
    themeAccent: branding.themeAccent,
    subject: form.subject,
  }

  if (loading) {
    return (
      <div className="p-5 text-center">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  return (
    <div className="p-4" id="invoice-builder">
      <style>{`
        #invoice-builder .form-stack { max-width: 1100px; }
        #invoice-builder .preview-wrap {
          background: #0B0F14;
          padding: 24px 16px 40px;
          border-radius: 12px;
          margin-top: 8px;
          overflow: hidden;
        }
        #invoice-builder .invoice-a4-paper {
          box-shadow: 0 16px 48px rgba(0,0,0,0.5);
          flex-shrink: 0;
        }
        @media (max-width: 767.98px) {
          #invoice-builder { padding: 0.75rem !important; }
        }
      `}</style>

      <div className="crm-page-header">
        <div>
          <Button variant="link" className="text-muted p-0 mb-2" onClick={() => navigate('/pages/invoices')}>
            ← Back to invoices
          </Button>
          <h3 className="fw-bold m-0">{isEdit ? 'Edit Invoice' : 'Create Invoice'}</h3>
        </div>
        <div className="crm-page-actions">
          <Button variant="outline-secondary" onClick={() => printInvoiceFromElement()}>
            <IconifyIcon icon="bx:printer" className="me-1" /> Print
          </Button>
          <Button
            variant="outline-success"
            onClick={async () => {
              try {
                await downloadInvoicePdf('invoice-a4-preview', `${previewModel.invoiceNumber}.pdf`)
                toast.success('PDF downloaded')
              } catch {
                toast.error('PDF failed')
              }
            }}
          >
            <IconifyIcon icon="bx:download" className="me-1" /> PDF
          </Button>
          <Button variant="primary" className="fw-bold px-4" disabled={saving} onClick={handleSubmit as any}>
            {saving ? 'Saving…' : 'Save Invoice'}
          </Button>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        {/* Form fields on top */}
        <div className="form-stack mx-auto">
          <Row className="g-3">
            <Col lg={6}>
            <Card className="border-0 mb-0 h-100" style={{ background: '#111827' }}>
              <Card.Body>
                <h6 className="fw-bold text-primary mb-3">Invoice Details</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-uppercase text-muted">Invoice Number</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="fw-bold border-end-0" style={{ color: '#FF4D00', background: 'transparent' }}>
                          {INVOICE_PREFIX}
                        </InputGroup.Text>
                        <Form.Control
                          required
                          className="border-start-0 ps-0"
                          value={invoiceIdNumber}
                          onChange={(e) => setInvoiceIdNumber(e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-uppercase text-muted">Status</Form.Label>
                      <Form.Select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as InvoiceStatus })}
                      >
                        {['Draft', 'Sent', 'Pending', 'Paid', 'Overdue', 'Cancelled'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-uppercase text-muted">Invoice Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={form.invoiceDate}
                        onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-uppercase text-muted">Due Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={form.dueDate}
                        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-uppercase text-muted">Currency</Form.Label>
                      <Form.Select
                        value={form.currency}
                        onChange={(e) => setForm({ ...form, currency: e.target.value as 'USD' | 'INR' })}
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-0">
                      <Form.Label className="small fw-bold text-uppercase text-muted">Subject</Form.Label>
                      <Form.Control
                        value={form.subject}
                        placeholder="e.g. Website Development Project"
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            </Col>

            <Col lg={6}>
            <Card className="border-0 mb-0 h-100" style={{ background: '#111827' }}>
              <Card.Body>
                <h6 className="fw-bold text-primary mb-3">Bill To</h6>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-uppercase text-muted">Client Name *</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        placeholder="Enter client / company name"
                        value={form.billTo.companyName}
                        onChange={(e) => {
                          setSelectedClientId('')
                          setForm({ ...form, billTo: { ...form.billTo, companyName: e.target.value } })
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small text-muted">Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={form.billTo.email}
                        onChange={(e) => setForm({ ...form, billTo: { ...form.billTo, email: e.target.value } })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small text-muted">Phone</Form.Label>
                      <Form.Control
                        value={form.billTo.phone}
                        onChange={(e) => setForm({ ...form, billTo: { ...form.billTo, phone: e.target.value } })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small text-muted">Billing Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={form.billTo.address}
                        onChange={(e) => setForm({ ...form, billTo: { ...form.billTo, address: e.target.value } })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small text-muted">GST / VAT</Form.Label>
                      <Form.Control
                        value={form.billTo.gstin}
                        onChange={(e) => setForm({ ...form, billTo: { ...form.billTo, gstin: e.target.value } })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            </Col>
          </Row>

            <Card className="border-0 mb-3 mt-3" style={{ background: '#111827' }}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-primary m-0">Line Items</h6>
                  <Button size="sm" variant="primary" onClick={() => setForm({ ...form, items: [...form.items, emptyItem()] })}>
                    + Add Item
                  </Button>
                </div>
                <Table responsive size="sm" className="align-middle mb-3">
                  <thead>
                    <tr className="text-muted small">
                      <th>Description</th>
                      <th style={{ width: 70 }}>Qty</th>
                      <th style={{ width: 90 }}>Rate</th>
                      <th style={{ width: 90 }}>Disc.</th>
                      <th style={{ width: 70 }}>Tax%</th>
                      <th style={{ width: 90 }}>Amt</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <Form.Control
                            size="sm"
                            value={item.description}
                            placeholder="Service / product"
                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          />
                        </td>
                        <td>
                          <Form.Control size="sm" type="number" value={item.qty} onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))} />
                        </td>
                        <td>
                          <Form.Control size="sm" type="number" value={item.rate} onChange={(e) => updateItem(idx, 'rate', Number(e.target.value))} />
                        </td>
                        <td>
                          <Form.Control size="sm" type="number" value={item.discount} onChange={(e) => updateItem(idx, 'discount', Number(e.target.value))} />
                        </td>
                        <td>
                          <Form.Control size="sm" type="number" value={item.taxPercent} onChange={(e) => updateItem(idx, 'taxPercent', Number(e.target.value))} />
                        </td>
                        <td className="small fw-bold">{previewTotals.items[idx]?.amount?.toLocaleString()}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="soft-danger"
                            disabled={form.items.length === 1}
                            onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}
                          >
                            <IconifyIcon icon="bx:trash" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <Row className="g-3 align-items-end">
                  <Col md={12}>
                    <Form.Label className="small fw-bold text-uppercase text-muted">Invoice Amount %</Form.Label>
                    <p className="small text-muted mb-2">
                      Full amount: <strong className="text-light">{form.currency === 'USD' ? '$' : '₹'}{previewTotals.grossTotal.toLocaleString()}</strong>
                      {' · '}Bill only a part (e.g. 50% advance)
                    </p>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {[25, 50, 75, 100].map((p) => (
                        <Button
                          key={p}
                          size="sm"
                          variant={form.billingPercent === p ? 'primary' : 'outline-primary'}
                          onClick={() => setForm({ ...form, billingPercent: p })}
                        >
                          {p}%
                        </Button>
                      ))}
                      <Form.Control
                        type="number"
                        min={1}
                        max={100}
                        style={{ width: 100 }}
                        size="sm"
                        value={form.billingPercent}
                        onChange={(e) => setForm({ ...form, billingPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                      />
                    </div>
                    <div className="fw-bold text-primary">
                      This invoice: {form.currency === 'USD' ? '$' : '₹'}
                      {previewTotals.totalAmount.toLocaleString()}
                      {form.billingPercent < 100 && (
                        <span className="text-muted small fw-normal ms-2">({form.billingPercent}% of full amount)</span>
                      )}
                    </div>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted">Amount Paid</Form.Label>
                      <Form.Control
                        type="number"
                        disabled={form.status === 'Paid'}
                        value={form.status === 'Paid' ? previewTotals.totalAmount : form.amountPaid}
                        onChange={(e) => setForm({ ...form, amountPaid: Number(e.target.value) })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="d-flex align-items-end">
                    <div className="w-100 text-end">
                      <div className="small text-muted">Balance Due</div>
                      <div className="fs-4 fw-bold text-primary">
                        {form.currency === 'USD' ? '$' : '₹'}
                        {previewTotals.balanceDue.toLocaleString()}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

          <Row className="g-3 mb-3">
            <Col lg={8}>
            <Card className="border-0 h-100" style={{ background: '#111827' }}>
              <Card.Body>
                <h6 className="fw-bold text-primary mb-3">Notes & Terms</h6>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Notes</Form.Label>
                  <Form.Control as="textarea" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </Form.Group>
                <Form.Group>
                  <Form.Label className="small text-muted">Terms & Conditions</Form.Label>
                  <Form.Control as="textarea" rows={4} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
                </Form.Group>
              </Card.Body>
            </Card>
            </Col>

            <Col lg={4}>
            <Card className="border-0 h-100" style={{ background: '#111827' }}>
              <Card.Body>
                <h6 className="fw-bold text-primary mb-2">Company Branding</h6>
                <p className="small text-muted mb-3">
                  Logo, signature, and authorized person are saved once in branding settings and auto-applied to every invoice.
                </p>
                {branding.logoUrl && (
                  <img src={branding.logoUrl} alt="Logo" style={{ height: 40, objectFit: 'contain', marginBottom: 8 }} />
                )}
                <div className="small mb-1"><strong>{branding.authorizedName}</strong></div>
                <div className="small text-muted mb-3">{branding.authorizedDesignation}</div>
                {branding.signatureUrl && (
                  <img
                    src={branding.signatureUrl}
                    alt="Signature"
                    style={{ maxHeight: 48, maxWidth: 140, objectFit: 'contain', background: '#fff', padding: 4, borderRadius: 4, marginBottom: 12 }}
                  />
                )}
                <Button size="sm" variant="outline-primary" className="w-100" onClick={() => navigate('/pages/invoices/settings')}>
                  Edit Branding Settings
                </Button>
              </Card.Body>
            </Card>
            </Col>
          </Row>
        </div>

        {/* PDF preview below */}
        <div className="preview-wrap">
          <div className="d-flex justify-content-between align-items-center mb-3 px-1" style={{ maxWidth: 900, margin: '0 auto' }}>
            <span className="small text-muted text-uppercase fw-bold">Invoice Preview (PDF)</span>
            <span className="small text-muted">Print-ready · A4 white paper</span>
          </div>
          <div className="preview-wrap">
            <InvoicePreview invoice={previewModel} companySettings={companySettings} />
          </div>
        </div>
      </Form>
    </div>
  )
}

export default InvoiceBuilderPage
