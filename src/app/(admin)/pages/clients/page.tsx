'use client'
import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Form, InputGroup, Modal, Row, Spinner, Table } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

interface ClientRow {
  _id: string
  companyName: string
  contactPerson?: string
  email?: string
  phone?: string
  website?: string
  industry?: string
  status: 'Active' | 'Inactive' | 'Prospect'
  servicesPurchased?: string[]
  assignedToName?: string
  totalRevenue?: number
  pendingInvoices?: number
  activeProjects?: number
  lastActivity?: { title?: string; type?: string; date?: string }
  createdAt?: string
}

const statusColor = (status: string) => {
  if (status === 'Active') return 'success'
  if (status === 'Prospect') return 'warning'
  return 'secondary'
}

const ClientsPage = () => {
  const navigate = useNavigate()
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const emptyForm = {
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    industry: 'General',
    status: 'Active',
    servicesPurchased: '',
    assignedToName: '',
  }
  const [form, setForm] = useState(emptyForm)

  const fetchClients = async () => {
    setLoading(true)
    try {
      const res = await api.get('/erp/clients')
      setClients(res.data || [])
    } catch {
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        c.companyName?.toLowerCase().includes(q) ||
        c.contactPerson?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [clients, search, statusFilter])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (client: ClientRow) => {
    setEditingId(client._id)
    setForm({
      companyName: client.companyName || '',
      contactPerson: client.contactPerson || '',
      email: client.email || '',
      phone: client.phone || '',
      website: client.website || '',
      industry: client.industry || 'General',
      status: client.status || 'Active',
      servicesPurchased: (client.servicesPurchased || []).join(', '),
      assignedToName: client.assignedToName || '',
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        servicesPurchased: form.servicesPurchased
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }
      if (editingId) {
        await api.put(`/erp/clients/${editingId}`, payload)
        toast.success('Client updated')
        setShowModal(false)
        setEditingId(null)
        fetchClients()
      } else {
        const res = await api.post('/erp/clients', payload)
        toast.success('Client created')
        setShowModal(false)
        setForm(emptyForm)
        navigate(`/pages/clients/${res.data._id}`)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || (editingId ? 'Failed to update client' : 'Failed to create client'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete client "${name}"?`)) return
    try {
      await api.delete(`/erp/clients/${id}`)
      toast.success('Client deleted')
      fetchClients()
    } catch {
      toast.error('Failed to delete client')
    }
  }

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === 'Active').length,
    revenue: clients.reduce((sum, c) => sum + (c.totalRevenue || 0), 0),
    pending: clients.reduce((sum, c) => sum + (c.pendingInvoices || 0), 0),
  }

  return (
    <div className="crm-page">
      <Row className="align-items-end mb-4 g-3">
        <Col>
          <p className="text-muted text-uppercase small fw-bold mb-1">CRM</p>
          <h3 className="fw-bold mb-1">Clients</h3>
          <p className="text-muted mb-0">Manage company accounts, revenue, and follow-ups in one workspace.</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" className="rounded-pill px-4" onClick={openCreate}>
            <IconifyIcon icon="bx:plus" className="me-1" /> New Client
          </Button>
        </Col>
      </Row>

      <div className="crm-stat-grid">
        <div className="crm-stat-card"><div className="crm-stat-label">Total Clients</div><p className="crm-stat-value">{stats.total}</p></div>
        <div className="crm-stat-card"><div className="crm-stat-label">Active</div><p className="crm-stat-value">{stats.active}</p></div>
        <div className="crm-stat-card"><div className="crm-stat-label">Total Revenue</div><p className="crm-stat-value">₹{stats.revenue.toLocaleString()}</p></div>
        <div className="crm-stat-card"><div className="crm-stat-label">Pending Invoices</div><p className="crm-stat-value">{stats.pending}</p></div>
      </div>

      <Card className="border-0 mb-3">
        <Card.Body className="py-3">
          <Row className="g-2 align-items-center">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text><IconifyIcon icon="bx:search" /></InputGroup.Text>
                <Form.Control placeholder="Search company, contact, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Prospect">Prospect</option>
                <option value="Inactive">Inactive</option>
              </Form.Select>
            </Col>
            <Col md={3} className="text-md-end">
              <Button variant="soft-secondary" onClick={fetchClients} disabled={loading}>
                <IconifyIcon icon="bx:refresh" className="me-1" /> Refresh
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 overflow-hidden">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="crm-empty">
              <div className="crm-empty-icon"><IconifyIcon icon="iconamoon:profile-circle-duotone" /></div>
              <h5 className="fw-bold">No clients yet</h5>
              <p className="mb-3">Add your first client to start tracking projects, invoices, and follow-ups.</p>
              <Button variant="primary" className="rounded-pill px-4" onClick={openCreate}>Create Client</Button>
            </div>
          ) : (
            <>
              <div className="crm-desktop-table table-responsive">
                <Table hover className="mb-0 align-middle">
                  <thead>
                    <tr>
                      <th className="ps-4">Company</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Projects</th>
                      <th>Revenue</th>
                      <th>Pending</th>
                      <th>Last Activity</th>
                      <th className="text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((client) => (
                      <tr key={client._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/pages/clients/${client._id}`)}>
                        <td className="ps-4 py-3">
                          <div className="fw-bold">{client.companyName}</div>
                          <div className="text-muted small">{client.industry || 'General'}</div>
                        </td>
                        <td>
                          <div className="fw-medium">{client.contactPerson || '—'}</div>
                          <div className="text-muted small">{client.email || client.phone || '—'}</div>
                        </td>
                        <td><Badge bg={statusColor(client.status)} className="rounded-pill px-3">{client.status}</Badge></td>
                        <td>{client.activeProjects ?? 0} active</td>
                        <td className="fw-bold">₹{(client.totalRevenue || 0).toLocaleString()}</td>
                        <td>{client.pendingInvoices || 0}</td>
                        <td className="text-muted small">{client.lastActivity?.title || client.lastActivity?.type || '—'}</td>
                        <td className="text-end pe-4" onClick={(e) => e.stopPropagation()}>
                          <Button as={Link as any} to={`/pages/clients/${client._id}`} variant="soft-primary" size="sm" className="me-1" title="View">
                            <IconifyIcon icon="bx:show" />
                          </Button>
                          <Button variant="soft-info" size="sm" className="me-1" title="Edit" onClick={() => openEdit(client)}>
                            <IconifyIcon icon="bx:edit" />
                          </Button>
                          <Button variant="soft-danger" size="sm" title="Delete" onClick={() => handleDelete(client._id, client.companyName)}>
                            <IconifyIcon icon="bx:trash" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="crm-mobile-cards">
                {filtered.map((client) => (
                  <div key={client._id} className="crm-mobile-card" onClick={() => navigate(`/pages/clients/${client._id}`)} style={{ cursor: 'pointer' }}>
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <p className="crm-mobile-card-title">{client.companyName}</p>
                        <div className="text-muted small">{client.contactPerson || client.email || '—'}</div>
                      </div>
                      <Badge bg={statusColor(client.status)} className="rounded-pill px-3">{client.status}</Badge>
                    </div>
                    <div className="crm-mobile-card-meta">
                      <div><span className="label">Projects</span>{client.activeProjects ?? 0} active</div>
                      <div><span className="label">Revenue</span><strong>₹{(client.totalRevenue || 0).toLocaleString()}</strong></div>
                      <div><span className="label">Pending</span>{client.pendingInvoices || 0}</div>
                      <div><span className="label">Activity</span>{client.lastActivity?.title || client.lastActivity?.type || '—'}</div>
                    </div>
                    <div className="crm-mobile-card-actions" onClick={(e) => e.stopPropagation()}>
                      <Button as={Link as any} to={`/pages/clients/${client._id}`} variant="soft-primary" size="sm">View</Button>
                      <Button variant="soft-info" size="sm" onClick={() => openEdit(client)}>Edit</Button>
                      <Button variant="soft-danger" size="sm" onClick={() => handleDelete(client._id, client.companyName)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false)
          setEditingId(null)
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{editingId ? 'Edit Client' : 'New Client'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Company Name *</Form.Label>
                <Form.Control required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              </Col>
              <Col md={6}>
                <Form.Label>Contact Person</Form.Label>
                <Form.Control value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
              </Col>
              <Col md={6}>
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Col>
              <Col md={6}>
                <Form.Label>Phone</Form.Label>
                <Form.Control value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Col>
              <Col md={6}>
                <Form.Label>Website</Form.Label>
                <Form.Control value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </Col>
              <Col md={6}>
                <Form.Label>Industry</Form.Label>
                <Form.Control value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
              </Col>
              <Col md={6}>
                <Form.Label>Status</Form.Label>
                <Form.Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="Active">Active</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Inactive">Inactive</option>
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label>Assigned Team Member</Form.Label>
                <Form.Control value={form.assignedToName} onChange={(e) => setForm({ ...form, assignedToName: e.target.value })} placeholder="e.g. Priya Sharma" />
              </Col>
              <Col xs={12}>
                <Form.Label>Services Purchased</Form.Label>
                <Form.Control value={form.servicesPurchased} onChange={(e) => setForm({ ...form, servicesPurchased: e.target.value })} placeholder="Website, SEO, Maintenance (comma separated)" />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="soft-secondary"
              onClick={() => {
                setShowModal(false)
                setEditingId(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Client' : 'Create Client'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}

export default ClientsPage
