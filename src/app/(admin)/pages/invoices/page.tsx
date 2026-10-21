
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Card, Spinner, Table } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'
import type {
  CompanySettings,
  InvoiceRecord,
  InvoiceStats,
} from '@/types/invoice'
import { STATUS_BADGE } from '@/types/invoice'
import { formatMoney } from '@/helpers/invoiceCalc'
import {
  printInvoiceDocument,
  toPreviewModel,
  downloadInvoicePdf,
} from '@/helpers/invoicePrint'
import InvoicePreview from '@/components/invoices/InvoicePreview'

const emptyStats: InvoiceStats = {
  totalRevenue: 0,
  paidAmount: 0,
  pendingAmount: 0,
  overdueAmount: 0,
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

const InvoicesPage = () => {
  const navigate = useNavigate()

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [stats, setStats] = useState<InvoiceStats>(emptyStats)
  const [companySettings, setCompanySettings] =
    useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfTarget, setPdfTarget] = useState<InvoiceRecord | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      const [invRes, settingsRes] = await Promise.all([
        api.get('/erp/invoices'),
        api.get('/erp/company-settings'),
      ])

      const payload = invRes.data
      const list = Array.isArray(payload)
        ? payload
        : payload.invoices || []

      setInvoices(list)
      setStats(payload.stats || emptyStats)
      setCompanySettings(settingsRes.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const clientLabel = (inv: InvoiceRecord) =>
    inv.billTo?.companyName ||
    inv.customClientName ||
    inv.client?.companyName ||
    '—'

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this invoice?')) return

    try {
      await api.delete(`/erp/invoices/${id}`)
      toast.success('Invoice deleted')
      await fetchData()
    } catch {
      toast.error('Failed to delete invoice')
    }
  }

  const handleDuplicate = async (inv: InvoiceRecord) => {
    try {
      const nextRes = await api.get('/erp/invoices/next-number')
      const { _id, createdAt, updatedAt, ...rest } = inv as any

      const payload = {
        ...rest,
        invoiceNumber: nextRes.data.invoiceNumber,
        status: 'Draft',
        amountPaid: 0,
        balanceDue: inv.totalAmount,
        client: inv.client?._id || inv.client || undefined,
      }

      const res = await api.post('/erp/invoices', payload)

      toast.success('Invoice duplicated')
      navigate(`/pages/invoices/${res.data._id}/edit`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Duplicate failed')
    }
  }

  const handleDownloadPdf = (inv: InvoiceRecord) => {
    if (pdfLoading) return

    setPdfLoading(true)
    setPdfTarget(inv)
  }

  useEffect(() => {
    if (!pdfTarget) return

    let cancelled = false

    const generatePdf = async () => {
      try {
        // Wait for the off-screen preview to mount.
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve())
        })

        if (cancelled) return

        const element = document.getElementById(
          'invoice-list-pdf-preview',
        )

        if (!element) {
          throw new Error('Invoice preview was not rendered')
        }

        // Wait for all images in the invoice to finish loading.
        const images = Array.from(element.querySelectorAll('img'))

        await Promise.all(
          images.map(
            (img) =>
              new Promise<void>((resolve) => {
                if (img.complete) {
                  resolve()
                  return
                }

                img.onload = () => resolve()
                img.onerror = () => resolve()
              }),
          ),
        )

        if (cancelled) return

        await downloadInvoicePdf(
          'invoice-list-pdf-preview',
          `${pdfTarget.invoiceNumber || 'invoice'}.pdf`,
        )

        if (!cancelled) {
          toast.success('PDF downloaded')
        }
      } catch (err: any) {
        if (!cancelled) {
          toast.error(err.message || 'PDF failed')
        }
      } finally {
        if (!cancelled) {
          setPdfTarget(null)
          setPdfLoading(false)
        }
      }
    }

    void generatePdf()

    return () => {
      cancelled = true
    }
  }, [pdfTarget])

  const statCards = [
    {
      label: 'Total Revenue',
      value: stats.totalRevenue,
      color: 'primary',
      icon: 'bx:rupee',
    },
    {
      label: 'Paid Amount',
      value: stats.paidAmount,
      color: 'success',
      icon: 'bx:check-circle',
    },
    {
      label: 'Pending Amount',
      value: stats.pendingAmount,
      color: 'warning',
      icon: 'bx:time-five',
    },
    {
      label: 'Overdue Amount',
      value: stats.overdueAmount,
      color: 'danger',
      icon: 'bx:error-circle',
    },
  ]

  if (loading) {
    return (
      <div className="p-5 text-center">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h3 className="fw-bold m-0 text-uppercase">Invoices</h3>
          <p className="text-muted small mb-0">
            Professional billing for Hoftrix agency clients
          </p>
        </div>

        <div className="crm-page-actions">
          <Button
            variant="primary"
            className="rounded-pill px-4 fw-bold"
            onClick={() => navigate('/pages/invoices/new')}
          >
            <IconifyIcon icon="bx:plus" className="me-1" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="crm-stat-grid">
        {statCards.map((card) => (
          <Card
            key={card.label}
            className="border-0 h-100"
            style={{ background: '#111827' }}
          >
            <Card.Body className="d-flex align-items-center gap-3">
              <div
                className={`avatar-md bg-soft-${card.color} text-${card.color} rounded-circle d-flex align-items-center justify-content-center`}
              >
                <IconifyIcon icon={card.icon} className="fs-24" />
              </div>

              <div>
                <p className="text-muted small mb-1 fw-bold text-uppercase">
                  {card.label}
                </p>
                <h4 className="fw-bold mb-0">
                  {formatMoney(card.value, 'USD')}
                </h4>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Invoice List */}
      <Card className="border-0" style={{ background: '#111827' }}>
        <Card.Body className="p-0">
          {invoices.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No invoices yet. Create your first professional invoice.
            </div>
          ) : (
            <>
              <div className="crm-desktop-table table-responsive">
                <Table hover className="mb-0 align-middle">
                  <thead>
                    <tr className="text-muted small text-uppercase">
                      <th className="px-4 py-3">Invoice</th>
                      <th>Client</th>
                      <th>Date</th>
                      <th>Received Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th className="text-end px-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv._id}>
                        <td className="px-4 py-3">
                          <Link
                            to={`/pages/invoices/${inv._id}`}
                            className="fw-bold text-primary text-decoration-none"
                          >
                            {inv.invoiceNumber}
                          </Link>
                        </td>

                        <td className="fw-medium">
                          {clientLabel(inv)}
                        </td>

                        <td className="text-muted small">
                          {formatDate(inv.invoiceDate)}
                        </td>

                        <td className="text-muted small">
                          {formatDate(
                            (inv as InvoiceRecord & {
                              createdAt?: string | Date
                            }).createdAt,
                          )}
                        </td>

                        <td className="fw-bold">
                          {formatMoney(inv.totalAmount, inv.currency)}
                        </td>

                        <td>
                          <Badge
                            bg={STATUS_BADGE[inv.status] || 'secondary'}
                            className="rounded-pill px-3"
                          >
                            {inv.status}
                          </Badge>
                        </td>

                        <td className="text-end px-4">
                          <div className="d-inline-flex gap-1 flex-wrap justify-content-end">
                            <Button
                              size="sm"
                              variant="soft-primary"
                              title="View"
                              onClick={() =>
                                navigate(`/pages/invoices/${inv._id}`)
                              }
                            >
                              <IconifyIcon icon="iconamoon:eye-duotone" />
                            </Button>

                            <Button
                              size="sm"
                              variant="soft-info"
                              title="Edit"
                              onClick={() =>
                                navigate(
                                  `/pages/invoices/${inv._id}/edit`,
                                )
                              }
                            >
                              <IconifyIcon icon="iconamoon:edit-duotone" />
                            </Button>

                            <Button
                              size="sm"
                              variant="soft-secondary"
                              title="Duplicate"
                              onClick={() => handleDuplicate(inv)}
                            >
                              <IconifyIcon icon="bx:copy" />
                            </Button>

                            <Button
                              size="sm"
                              variant="soft-success"
                              title="Download PDF"
                              disabled={pdfLoading}
                              onClick={() => handleDownloadPdf(inv)}
                            >
                              <IconifyIcon icon="bx:download" />
                            </Button>

                            <Button
                              size="sm"
                              variant="soft-warning"
                              title="Print"
                              onClick={() =>
                                printInvoiceDocument(
                                  {
                                    ...toPreviewModel(inv),
                                    createdAt: (
                                      inv as InvoiceRecord & {
                                        createdAt?: string | Date
                                      }
                                    ).createdAt,
                                  } as any,
                                  companySettings,
                                )
                              }
                            >
                              <IconifyIcon icon="bx:printer" />
                            </Button>

                            <Button
                              size="sm"
                              variant="soft-danger"
                              title="Delete"
                              onClick={() => handleDelete(inv._id)}
                            >
                              <IconifyIcon icon="bx:trash" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Mobile Invoice Cards */}
              <div className="crm-mobile-cards">
                {invoices.map((inv) => (
                  <div key={inv._id} className="crm-mobile-card">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <p className="crm-mobile-card-title">
                          {inv.invoiceNumber}
                        </p>
                        <div className="text-muted small">
                          {clientLabel(inv)}
                        </div>
                      </div>

                      <Badge
                        bg={STATUS_BADGE[inv.status] || 'secondary'}
                        className="rounded-pill px-3"
                      >
                        {inv.status}
                      </Badge>
                    </div>

                    <div className="crm-mobile-card-meta">
                      <div>
                        <span className="label">Amount</span>
                        <strong>
                          {formatMoney(inv.totalAmount, inv.currency)}
                        </strong>
                      </div>

                      <div>
                        <span className="label">Invoice Date</span>
                        {formatDate(inv.invoiceDate)}
                      </div>

                      <div>
                        <span className="label">Received Date</span>
                        {formatDate(
                          (inv as InvoiceRecord & {
                            createdAt?: string | Date
                          }).createdAt,
                        )}
                      </div>
                    </div>

                    <div className="crm-mobile-card-actions">
                      <Button
                        size="sm"
                        variant="soft-primary"
                        onClick={() =>
                          navigate(`/pages/invoices/${inv._id}`)
                        }
                      >
                        View
                      </Button>

                      <Button
                        size="sm"
                        variant="soft-info"
                        onClick={() =>
                          navigate(`/pages/invoices/${inv._id}/edit`)
                        }
                      >
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="soft-success"
                        disabled={pdfLoading}
                        onClick={() => handleDownloadPdf(inv)}
                      >
                        PDF
                      </Button>

                      <Button
                        size="sm"
                        variant="soft-danger"
                        onClick={() => handleDelete(inv._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Hidden invoice preview used for PDF generation */}
      {pdfTarget && (
        <div
          style={{
            position: 'fixed',
            left: '-10000px',
            top: 0,
            width: '210mm',
            zIndex: -1,
            pointerEvents: 'none',
          }}
        >
          <InvoicePreview
            id="invoice-list-pdf-preview"
            invoice={
              {
                ...toPreviewModel(pdfTarget),
                createdAt: (
                  pdfTarget as InvoiceRecord & {
                    createdAt?: string | Date
                  }
                ).createdAt,
              } as any
            }
            receivedDate={
              (
                pdfTarget as InvoiceRecord & {
                  createdAt?: string | Date
                }
              ).createdAt
            }
            companySettings={companySettings}
            scaled={false}
          />
        </div>
      )}
    </div>
  )
}

export default InvoicesPage
