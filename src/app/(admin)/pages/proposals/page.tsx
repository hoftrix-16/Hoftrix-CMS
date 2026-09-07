'use client'
import { useEffect, useState } from 'react'
import { Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

interface ClientOption {
  _id: string
  companyName: string
}

interface Proposal {
  _id: string
  title: string
  client?: string
  clientName?: string
  amount: number
  currency?: string
  status: string
  notes?: string
}

const emptyForm = {
  title: '',
  client: '',
  clientName: '',
  amount: '',
  currency: 'INR',
  status: 'Draft',
  notes: '',
}

const ProposalsPage = () => {
  const [rows, setRows] = useState<Proposal[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [propRes, clientRes] = await Promise.all([
        api.get('/erp/proposals'),
        api.get('/erp/clients'),
      ])
      setRows(propRes.data || [])
      setClients(clientRes.data || [])
    } catch {
      toast.error('Failed to load proposals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (row: Proposal) => {
    setEditingId(row._id)
    setForm({
      title: row.title || '',
      client: row.client || '',
      clientName: row.clientName || '',
      amount: String(row.amount ?? ''),
      currency: row.currency || 'INR',
      status: row.status || 'Draft',
      notes: row.notes || '',
    })
    setShowModal(true)
  }

  const onClientChange = (clientId: string) => {
    const selected = clients.find((c) => c._id === clientId)
    setForm({
      ...form,
      client: clientId,
      clientName: selected?.companyName || '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title,
      client: form.client || undefined,
      clientName: form.clientName,
      amount: Number(form.amount),
      currency: form.currency,
      status: form.status,
      notes: form.notes,
    }
    try {
      if (editingId) {
        await api.put(`/erp/proposals/${editingId}`, payload)
        toast.success('Proposal updated')
      } else {
        await api.post('/erp/proposals', payload)
        toast.success('Proposal created')
      }
      setShowModal(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save proposal')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete proposal "${title}"?`)) return
    try {
      await api.delete(`/erp/proposals/${id}`)
      toast.success('Proposal deleted')
      fetchData()
    } catch {
      toast.error('Failed to delete proposal')
    }
  }

  const statusColor = (s: string) => {
    if (s === 'Accepted' || s === 'Won') return 'success'
    if (s === 'Sent') return 'info'
    if (s === 'Rejected' || s === 'Lost') return 'danger'
    return 'secondary'
  }

  return (
    <div className="crm-page">
      <Row className="align-items-end mb-4 g-3">
        <Col>
          <p className="text-muted text-uppercase small fw-bold mb-1">Marketing</p>
          <h3 className="fw-bold mb-1">Proposals</h3>
          <p className="text-muted mb-0">Create and track client proposals.</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" className="rounded-pill px-4" onClick={openCreate}>
            <IconifyIcon icon="bx:plus" className="me-1" /> New Proposal
          </Button>
        </Col>
      </Row>

      <Card className="border-0 overflow-hidden">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : rows.length === 0 ? (
            <div className="crm-empty">
              <div className="crm-empty-icon"><IconifyIcon icon="iconamoon:file-document-duotone" /></div>
              <h5 className="fw-bold">No proposals</h5>
              <p className="mb-3">Draft your first client proposal.</p>
              <Button variant="primary" className="rounded-pill px-4" onClick={openCreate}>Create Proposal</Button>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead>
                <tr>
                  <th className="ps-4">Title</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id}>
                    <td className="ps-4 py-3 fw-semibold">{row.title}</td>
                    <td>{row.clientName || '—'}</td>
                    <td className="fw-bold">{row.currency || 'INR'} {(row.amount || 0).toLocaleString()}</td>
                    <td><Badge bg={statusColor(row.status)} className="rounded-pill px-3">{row.status}</Badge></td>
                    <td className="text-end pe-4">
                      <Button size="sm" variant="soft-primary" className="me-1" onClick={() => openEdit(row)}>
                        <IconifyIcon icon="bx:edit" />
                      </Button>
                      <Button size="sm" variant="soft-danger" onClick={() => handleDelete(row._id, row.title)}>
                        <IconifyIcon icon="bx:trash" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{editingId ? 'Edit Proposal' : 'New Proposal'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Client</Form.Label>
              <Form.Select value={form.client} onChange={(e) => onClientChange(e.target.value)}>
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>{c.companyName}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Client Name</Form.Label>
              <Form.Control value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Auto-filled or custom" />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount *</Form.Label>
                  <Form.Control type="number" required min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Currency</Form.Label>
                  <Form.Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Notes</Form.Label>
              <Form.Control as="textarea" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="soft-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}

export default ProposalsPage
