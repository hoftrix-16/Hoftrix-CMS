'use client'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Spinner } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'
import InvoicePreview from '@/components/invoices/InvoicePreview'
import { downloadInvoicePdf, printInvoiceFromElement, toPreviewModel } from '@/helpers/invoicePrint'
import type { CompanySettings, InvoiceRecord } from '@/types/invoice'
import { STATUS_BADGE } from '@/types/invoice'

const InvoiceViewPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null)
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [invRes, settingsRes] = await Promise.all([
          api.get(`/erp/invoices/${id}`),
          api.get('/erp/company-settings'),
        ])
        setInvoice(invRes.data)
        setCompanySettings(settingsRes.data)
      } catch {
        toast.error('Invoice not found')
        navigate('/pages/invoices')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  if (loading || !invoice) {
    return (
      <div className="p-5 text-center">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  const model = toPreviewModel(invoice)

  return (
    <div className="crm-page invoice-view-page">
      <div className="crm-page-header">
        <div>
          <Button variant="link" className="text-muted p-0 mb-2" onClick={() => navigate('/pages/invoices')}>
            ← Back to invoices
          </Button>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h3 className="fw-bold m-0">{invoice.invoiceNumber}</h3>
            <Badge bg={STATUS_BADGE[invoice.status] || 'secondary'} className="rounded-pill px-3">
              {invoice.status}
            </Badge>
          </div>
        </div>
        <div className="crm-page-actions">
          <Button variant="outline-info" onClick={() => navigate(`/pages/invoices/${id}/edit`)}>
            <IconifyIcon icon="iconamoon:edit-duotone" className="me-1" /> Edit
          </Button>
          <Button variant="outline-secondary" onClick={() => printInvoiceFromElement()}>
            <IconifyIcon icon="bx:printer" className="me-1" /> Print
          </Button>
          <Button
            variant="outline-success"
            onClick={async () => {
              try {
                await downloadInvoicePdf('invoice-a4-preview', `${invoice.invoiceNumber}.pdf`)
                toast.success('PDF downloaded')
              } catch {
                toast.error('PDF failed')
              }
            }}
          >
            <IconifyIcon icon="bx:download" className="me-1" /> PDF
          </Button>
        </div>
      </div>

      <div className="preview-wrap" style={{ background: '#0B0F14', borderRadius: 12, padding: 20 }}>
        <InvoicePreview invoice={model} companySettings={companySettings} />
      </div>
    </div>
  )
}

export default InvoiceViewPage
