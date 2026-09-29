'use client'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom'
import { Button, Card, Col, Form, InputGroup, Row, Spinner, Table } from 'react-bootstrap'
import { useFormik, FieldArray, FormikProvider } from 'formik'
import * as Yup from 'yup'
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
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

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



// Regex Validations
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const phoneRegex = /^\d{7,18}$/
const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

// Yup Validation Schema
const validationSchema = Yup.object().shape({
  invoiceIdNumber: Yup.string().trim().required('Invoice number is required'),
  subject: Yup.string().max(200, 'Subject is too long'),
  invoiceDate: Yup.date().required('Invoice date is required'),
  dueDate: Yup.date()
    .nullable()
    .min(Yup.ref('invoiceDate'), 'Due date cannot be before invoice date'),
  status: Yup.string().required('Status is required'),
  currency: Yup.string().oneOf(['INR', 'USD']).required('Currency is required'),

  billTo: Yup.object().shape({
    companyName: Yup.string().trim().required('Client / Company name is required'),
    email: Yup.string()
      .trim()
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .matches(emailRegex, 'Enter a valid email address'),
  phone: Yup.string()
  .trim()
  .nullable()
  .test(
    'valid-phone',
    'Enter a valid phone number',
    (value) => {
      if (!value) {
        return true
      }

      const digits = value.replace(/\D/g, '')
      return phoneRegex.test(digits)
    }
  ),
    address: Yup.string().max(500, 'Address is too long'),
    gstin: Yup.string()
      .trim()
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .matches(gstinRegex, 'Enter a valid GSTIN format (e.g. 22AAAAA0000A1Z5)'),
  }),

  items: Yup.array()
    .of(
      Yup.object().shape({
        description: Yup.string().trim().required('Item description is required'),
        qty: Yup.number()
          .typeError('Qty must be a number')
          .min(1, 'Min qty is 1')
          .required('Qty required'),
        rate: Yup.number()
          .typeError('Rate must be a number')
          .min(0, 'Min rate is 0')
          .required('Rate required'),
        discount: Yup.number()
          .typeError('Discount must be a number')
          .min(0, 'Min discount is 0'),
        taxPercent: Yup.number()
          .typeError('Tax must be a number')
          .min(0, 'Min 0%')
          .max(100, 'Max 100%'),
      })
    )
    .min(1, 'At least one line item is required'),

  billingPercent: Yup.number()
    .min(1, 'Min 1%')
    .max(100, 'Max 100%')
    .required('Billing percent is required'),
  amountPaid: Yup.number()
    .min(0, 'Cannot be negative')
    .typeError('Must be a number'),
})

const InvoiceBuilderPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id) && location.pathname.endsWith('/edit')
  const isNew = location.pathname.endsWith('/new') || !id
  const prefillClientId = searchParams.get('clientId') || ''
const [phoneDialCode, setPhoneDialCode] = useState('91')
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  const [selectedClientId, setSelectedClientId] = useState('')

  const formik = useFormik({
    initialValues: {
      invoiceIdNumber: '',
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
    },
    validationSchema,
    onSubmit: async (values) => {
      setSaving(true)
      const computed = computeInvoiceTotals(
        values.items,
        values.status === 'Paid' ? 0 : values.amountPaid,
        values.billingPercent
      )
      const paidAmount = values.status === 'Paid' ? computed.totalAmount : values.amountPaid

      const phoneDigits = values.billTo.phone.replace(/\D/g, '')
      const dialCodeDigits = phoneDialCode.replace(/\D/g, '')

      let formattedPhone = ''

      if (phoneDigits && dialCodeDigits) {
        const mobileNumber = phoneDigits.startsWith(dialCodeDigits)
          ? phoneDigits.slice(dialCodeDigits.length)
          : phoneDigits

        if (mobileNumber) {
          formattedPhone = `+${dialCodeDigits}-${mobileNumber}`
        }
      }

      const payload: any = {
        invoiceNumber: values.invoiceIdNumber.trim(),
        client: selectedClientId || undefined,
        customClientName: values.billTo.companyName,
        billTo: {
          ...values.billTo,
          phone: formattedPhone,
        },
        subject: values.subject,
        invoiceDate: values.invoiceDate,
        dueDate: values.dueDate || undefined,
        status: values.status,
        currency: values.currency,
        items: computed.items,
        subtotal: computed.subtotal,
        discountTotal: computed.discountTotal,
        taxTotal: computed.taxTotal,
        grossTotal: computed.grossTotal,
        billingPercent: computed.billingPercent,
        totalAmount: computed.totalAmount,
        amountPaid: paidAmount,
        balanceDue: values.status === 'Paid' ? 0 : Math.max(0, computed.totalAmount - paidAmount),
        notes: values.notes,
        terms: values.terms,
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
    },
  })

  const { values, errors, touched, handleChange, handleBlur, setFieldValue, handleSubmit } = formik

  const baseTotals = computeInvoiceTotals(values.items, 0, values.billingPercent)
  const effectivePaid = values.status === 'Paid' ? baseTotals.totalAmount : values.amountPaid
  const previewTotals = computeInvoiceTotals(values.items, effectivePaid, values.billingPercent)

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

      let nextInvNum = ''

if (nextRes?.data?.invoiceNumber) {
  nextInvNum = nextRes.data.invoiceNumber as string
}
        let prefilledBillTo = emptyBillTo()
        if (isNew && prefillClientId) {
          try {
            const clientRes = await api.get(`/erp/clients/${prefillClientId}`)
            const c = clientRes.data
            setSelectedClientId(c._id)
            prefilledBillTo = {
              companyName: c.companyName || '',
              contactPerson: c.contactPerson || '',
              email: c.email || '',
              phone: c.phone || '',
              address: c.address || '',
              gstin: '',
            }
          } catch {
            /* ignore prefill errors */
          }
        }

        if (isEdit && id) {
          const res = await api.get(`/erp/invoices/${id}`)
          const inv = res.data
          const full = inv.invoiceNumber || ''
          setSelectedClientId(inv.client?._id || '')

          formik.resetForm({
            values: {
              invoiceIdNumber: full.startsWith(INVOICE_PREFIX) ? full.slice(INVOICE_PREFIX.length) : full,
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
            },
          })
        } else {
          setFieldValue('invoiceIdNumber', nextInvNum)
          setFieldValue('notes', settings.defaultNotes || DEFAULT_NOTES)
          setFieldValue('terms', settings.defaultTerms || DEFAULT_TERMS)
          if (prefilledBillTo.companyName) {
            setFieldValue('billTo', prefilledBillTo)
          }
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

  const updateItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const updatedItems = [...values.items]
    const current = { ...updatedItems[index], [field]: value }
    current.amount = computeInvoiceTotals([current]).items[0].amount
    updatedItems[index] = current
    setFieldValue('items', updatedItems)
  }

  const previewModel = {
    invoiceNumber: INVOICE_PREFIX + values.invoiceIdNumber,
    invoiceDate: values.invoiceDate,
    dueDate: values.dueDate,
    status: values.status,
    currency: values.currency,
    billTo: values.billTo,
    items: previewTotals.items,
    subtotal: previewTotals.subtotal,
    discountTotal: previewTotals.discountTotal,
    taxTotal: previewTotals.taxTotal,
    grossTotal: previewTotals.grossTotal,
    billingPercent: previewTotals.billingPercent,
    totalAmount: previewTotals.totalAmount,
    amountPaid: previewTotals.amountPaid,
    balanceDue: previewTotals.balanceDue,
    notes: values.notes,
    terms: values.terms,
    signatureUrl: branding.signatureUrl,
    authorizedName: branding.authorizedName,
    authorizedDesignation: branding.authorizedDesignation,
    logoUrl: branding.logoUrl,
    logoSize: branding.logoSize,
    themeAccent: branding.themeAccent,
    subject: values.subject,
  }

  if (loading) {
    return (
      <div className="p-5 text-center">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  return (
    <FormikProvider value={formik}>
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

          /* Phone input dark theme */
          #invoice-builder .react-tel-input {
            width: 100%;
          }

          #invoice-builder .react-tel-input .form-control {
            width: 100%;
            height: 42px;
            background: #1f2937 !important;
            color: #f8fafc !important;
            border: 1px solid #374151 !important;
            border-radius: 6px !important;
          }

          #invoice-builder .react-tel-input .form-control:focus {
            border-color: #0ea5e9 !important;
            box-shadow: 0 0 0 1px #0ea5e9 !important;
          }

          #invoice-builder .react-tel-input .flag-dropdown {
            background: #1f2937 !important;
            border: 1px solid #374151 !important;
            border-radius: 6px 0 0 6px !important;
          }

          #invoice-builder .react-tel-input .selected-flag:hover,
          #invoice-builder .react-tel-input .selected-flag:focus {
            background: #374151 !important;
          }

          #invoice-builder .react-tel-input .country-list {
            background: #111827 !important;
            color: #f8fafc !important;
            border: 1px solid #374151 !important;
            z-index: 9999 !important;
          }

          #invoice-builder .react-tel-input .country-list .country {
            color: #e5e7eb !important;
            background: #111827 !important;
          }

          #invoice-builder .react-tel-input .country-list .country:hover,
          #invoice-builder .react-tel-input .country-list .country.highlight {
            background: #1f2937 !important;
            color: #fff !important;
          }

          #invoice-builder .react-tel-input .country-list .dial-code {
            color: #94a3b8 !important;
          }

          #invoice-builder .react-tel-input .country-list .search {
            background: #111827 !important;
          }

          #invoice-builder .react-tel-input .country-list .search-box {
            background: #1f2937 !important;
            color: #f8fafc !important;
            border: 1px solid #374151 !important;
          }

          #invoice-builder .react-tel-input .country-list .search-box::placeholder {
            color: #94a3b8 !important;
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
            <Button variant="primary" className="fw-bold px-4" disabled={saving} onClick={() => handleSubmit()}>
              {saving ? 'Saving…' : 'Save Invoice'}
            </Button>
          </div>
        </div>

        <Form noValidate onSubmit={handleSubmit}>
          <div className="form-stack mx-auto">
            <Row className="g-3">
              {/* Invoice Details */}
              <Col lg={6}>
                <Card className="border-0 mb-0 h-100" style={{ background: '#111827' }}>
                  <Card.Body>
                    <h6 className="fw-bold text-primary mb-3">Invoice Details</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold text-uppercase text-muted">
                            Invoice Number *
                          </Form.Label>
                        <Form.Control
  name="invoiceIdNumber"
  value={values.invoiceIdNumber}
  readOnly
  className="fw-bold"
  style={{
    color: '#FF4D00',
    background: 'rgba(255, 77, 0, 0.05)',
    borderColor: '#FF4D00',
  }}
  isInvalid={touched.invoiceIdNumber && !!errors.invoiceIdNumber}
/>

<Form.Control.Feedback type="invalid">
  {errors.invoiceIdNumber}
</Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold text-uppercase text-muted">Status</Form.Label>
                          <Form.Select
                            name="status"
                            value={values.status}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          >
                            {['Draft', 'Sent', 'Pending', 'Paid', 'Overdue', 'Cancelled'].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold text-uppercase text-muted">
                            Invoice Date *
                          </Form.Label>
                          <Form.Control
                            type="date"
                            name="invoiceDate"
                            value={values.invoiceDate}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.invoiceDate && !!errors.invoiceDate}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.invoiceDate}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold text-uppercase text-muted">Due Date</Form.Label>
                          <Form.Control
                            type="date"
                            name="dueDate"
                            value={values.dueDate}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.dueDate && !!errors.dueDate}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.dueDate}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold text-uppercase text-muted">Currency</Form.Label>
                          <Form.Select
                            name="currency"
                            value={values.currency}
                            onChange={handleChange}
                            onBlur={handleBlur}
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
                            name="subject"
                            value={values.subject}
                            placeholder="e.g. Website Development Project"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.subject && !!errors.subject}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.subject}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              {/* Bill To */}
              <Col lg={6}>
                <Card className="border-0 mb-0 h-100" style={{ background: '#111827' }}>
                  <Card.Body>
                    <h6 className="fw-bold text-primary mb-3">Bill To</h6>
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold text-uppercase text-muted">
                            Client Name *
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="billTo.companyName"
                            placeholder="Enter client / company name"
                            value={values.billTo.companyName}
                            onChange={(e) => {
                              setSelectedClientId('')
                              handleChange(e)
                            }}
                            onBlur={handleBlur}
                            isInvalid={touched.billTo?.companyName && !!errors.billTo?.companyName}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.billTo?.companyName}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small text-muted">Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="billTo.email"
                            placeholder="client@company.com"
                            value={values.billTo.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.billTo?.email && !!errors.billTo?.email}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.billTo?.email}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                       <Form.Group className="mb-3">
  <Form.Label className="small text-muted">
    Phone
  </Form.Label>

  <PhoneInput
                            country="in"
                            enableSearch
                            searchPlaceholder="Search country..."
                            countryCodeEditable={false}
                            value={values.billTo.phone.replace(/\D/g, '')}
                            onChange={(value, country) => {
                              const dialCode =
                                typeof country === 'object' && country !== null
                                  ? String(country.dialCode || '')
                                  : ''

                              if (dialCode) {
                                setPhoneDialCode(dialCode)
                              }

                              setFieldValue('billTo.phone', value)
                            }}
                            inputProps={{
                              name: 'billTo.phone',
                              type: 'tel',
                              autoComplete: 'tel',
                              inputMode: 'tel',
                            }}
                            containerStyle={{ width: '100%' }}
                            inputStyle={{
                              width: '100%',
                              height: '42px',
                              background: '#1f2937',
                              color: '#f8fafc',
                              border: '1px solid #374151',
                              borderRadius: '6px',
                            }}
                            buttonStyle={{
                              background: '#1f2937',
                              border: '1px solid #374151',
                              borderRight: 0,
                              borderRadius: '6px 0 0 6px',
                            }}
                          />
  {touched.billTo?.phone && errors.billTo?.phone && (
    <div className="text-danger small mt-1">
      {errors.billTo.phone}
    </div>
  )}
</Form.Group>
                      </Col>

                      <Col md={8}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small text-muted">Billing Address</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            name="billTo.address"
                            value={values.billTo.address}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.billTo?.address && !!errors.billTo?.address}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.billTo?.address}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small text-muted">GST / VAT</Form.Label>
                          <Form.Control
                            type="text"
                            name="billTo.gstin"
                            placeholder="22AAAAA0000A1Z5"
                            value={values.billTo.gstin}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.billTo?.gstin && !!errors.billTo?.gstin}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.billTo?.gstin}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Line Items */}
            <Card className="border-0 mb-3 mt-3" style={{ background: '#111827' }}>
              <Card.Body>
                <FieldArray name="items">
                  {({ push, remove }) => (
                    <>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold text-primary m-0">Line Items</h6>
                        <Button size="sm" variant="primary" onClick={() => push(emptyItem())}>
                          + Add Item
                        </Button>
                      </div>

                      {typeof errors.items === 'string' && (
                        <div className="text-danger small mb-2">{errors.items}</div>
                      )}

                      <Table responsive size="sm" className="align-middle mb-3">
                        <thead>
                          <tr className="text-muted small">
                            <th>Description *</th>
                            <th style={{ width: 85 }}>Qty *</th>
                            <th style={{ width: 100 }}>Rate *</th>
                            <th style={{ width: 90 }}>Disc.</th>
                            <th style={{ width: 80 }}>Tax%</th>
                            <th style={{ width: 90 }}>Amt</th>
                            <th style={{ width: 40 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {values.items.map((item, idx) => {
                            const itemErrors = (errors.items as any)?.[idx] || {}
                            const itemTouched = (touched.items as any)?.[idx] || {}

                            return (
                              <tr key={idx}>
                                <td>
                                  <Form.Control
                                    size="sm"
                                    name={`items.${idx}.description`}
                                    value={item.description}
                                    placeholder="Service / product"
                                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                    onBlur={handleBlur}
                                    isInvalid={itemTouched.description && !!itemErrors.description}
                                  />
                                  <Form.Control.Feedback type="invalid">
                                    {itemErrors.description}
                                  </Form.Control.Feedback>
                                </td>
                                <td>
                                  <Form.Control
                                    size="sm"
                                    type="number"
                                    min="1"
                                    name={`items.${idx}.qty`}
                                    value={item.qty}
                                    onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))}
                                    onBlur={handleBlur}
                                    isInvalid={itemTouched.qty && !!itemErrors.qty}
                                  />
                                </td>
                                <td>
                                  <Form.Control
                                    size="sm"
                                    type="number"
                                    min="0"
                                    name={`items.${idx}.rate`}
                                    value={item.rate}
                                    onChange={(e) => updateItem(idx, 'rate', Number(e.target.value))}
                                    onBlur={handleBlur}
                                    isInvalid={itemTouched.rate && !!itemErrors.rate}
                                  />
                                </td>
                                <td>
                                  <Form.Control
                                    size="sm"
                                    type="number"
                                    min="0"
                                    name={`items.${idx}.discount`}
                                    value={item.discount}
                                    onChange={(e) => updateItem(idx, 'discount', Number(e.target.value))}
                                    onBlur={handleBlur}
                                    isInvalid={itemTouched.discount && !!itemErrors.discount}
                                  />
                                </td>
                                <td>
                                  <Form.Control
                                    size="sm"
                                    type="number"
                                    min="0"
                                    max="100"
                                    name={`items.${idx}.taxPercent`}
                                    value={item.taxPercent}
                                    onChange={(e) => updateItem(idx, 'taxPercent', Number(e.target.value))}
                                    onBlur={handleBlur}
                                    isInvalid={itemTouched.taxPercent && !!itemErrors.taxPercent}
                                  />
                                </td>
                                <td className="small fw-bold">
                                  {previewTotals.items[idx]?.amount?.toLocaleString()}
                                </td>
                                <td>
                                  <Button
                                    size="sm"
                                    variant="soft-danger"
                                    disabled={values.items.length === 1}
                                    onClick={() => remove(idx)}
                                  >
                                    <IconifyIcon icon="bx:trash" />
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </Table>
                    </>
                  )}
                </FieldArray>

                <Row className="g-3 align-items-end">
                  <Col md={12}>
                    <Form.Label className="small fw-bold text-uppercase text-muted">
                      Invoice Amount %
                    </Form.Label>
                    <p className="small text-muted mb-2">
                      Full amount:{' '}
                      <strong className="text-light">
                        {values.currency === 'USD' ? '$' : '₹'}
                        {previewTotals.grossTotal.toLocaleString()}
                      </strong>{' '}
                      · Bill only a part (e.g. 50% advance)
                    </p>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {[25, 50, 75, 100].map((p) => (
                        <Button
                          key={p}
                          size="sm"
                          variant={values.billingPercent === p ? 'primary' : 'outline-primary'}
                          onClick={() => setFieldValue('billingPercent', p)}
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
                        name="billingPercent"
                        value={values.billingPercent}
                        onChange={(e) =>
                          setFieldValue(
                            'billingPercent',
                            Math.min(100, Math.max(0, Number(e.target.value) || 0))
                          )
                        }
                        onBlur={handleBlur}
                        isInvalid={touched.billingPercent && !!errors.billingPercent}
                      />
                    </div>
                    <div className="fw-bold text-primary">
                      This invoice: {values.currency === 'USD' ? '$' : '₹'}
                      {previewTotals.totalAmount.toLocaleString()}
                      {values.billingPercent < 100 && (
                        <span className="text-muted small fw-normal ms-2">
                          ({values.billingPercent}% of full amount)
                        </span>
                      )}
                    </div>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted">Amount Paid</Form.Label>
                      <Form.Control
                        type="number"
                        name="amountPaid"
                        disabled={values.status === 'Paid'}
                        value={values.status === 'Paid' ? previewTotals.totalAmount : values.amountPaid}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.amountPaid && !!errors.amountPaid}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.amountPaid}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6} className="d-flex align-items-end">
                    <div className="w-100 text-end">
                      <div className="small text-muted">Balance Due</div>
                      <div className="fs-4 fw-bold text-primary">
                        {values.currency === 'USD' ? '$' : '₹'}
                        {previewTotals.balanceDue.toLocaleString()}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Notes & Branding */}
            <Row className="g-3 mb-3">
              <Col lg={8}>
                <Card className="border-0 h-100" style={{ background: '#111827' }}>
                  <Card.Body>
                    <h6 className="fw-bold text-primary mb-3">Notes & Terms</h6>
                    <Form.Group className="mb-3">
                      <Form.Label className="small text-muted">Notes</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="notes"
                        value={values.notes}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label className="small text-muted">Terms & Conditions</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="terms"
                        value={values.terms}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4}>
                <Card className="border-0 h-100" style={{ background: '#111827' }}>
                  <Card.Body>
                    <h6 className="fw-bold text-primary mb-2">Company Branding</h6>
                    <p className="small text-muted mb-3">
                      Logo, signature, and authorized person are saved once in branding settings and
                      auto-applied to every invoice.
                    </p>
                    {branding.logoUrl && (
                      <img
                        src={branding.logoUrl}
                        alt="Logo"
                        style={{ height: 40, objectFit: 'contain', marginBottom: 8 }}
                      />
                    )}
                    <div className="small mb-1">
                      <strong>{branding.authorizedName}</strong>
                    </div>
                    <div className="small text-muted mb-3">{branding.authorizedDesignation}</div>
                    {branding.signatureUrl && (
                      <img
                        src={branding.signatureUrl}
                        alt="Signature"
                        style={{
                          maxHeight: 48,
                          maxWidth: 140,
                          objectFit: 'contain',
                          background: '#fff',
                          padding: 4,
                          borderRadius: 4,
                          marginBottom: 12,
                        }}
                      />
                    )}
                    {/* <Button
                      size="sm"
                      variant="outline-primary"
                      className="w-100"
                      onClick={() => navigate('/pages/invoices/settings')}
                    >
                      Edit Branding Settings
                    </Button> */}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>

          {/* PDF Preview */}
          <div className="preview-wrap">
            <div
              className="d-flex justify-content-between align-items-center mb-3 px-1"
              style={{ maxWidth: 900, margin: '0 auto' }}
            >
              <span className="small text-muted text-uppercase fw-bold">
                Invoice Preview (PDF)
              </span>
              <span className="small text-muted">Print-ready · A4 white paper</span>
            </div>
            <div className="preview-wrap">
              <InvoicePreview invoice={previewModel} companySettings={companySettings} />
            </div>
          </div>
        </Form>
      </div>
    </FormikProvider>
  )
}

export default InvoiceBuilderPage