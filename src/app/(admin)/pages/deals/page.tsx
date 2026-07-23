'use client'
import { useEffect, useState } from 'react'
import { Badge, Button, Card, Col, Form, Modal, Row } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'
import { useAuthContext } from '@/context/useAuthContext'

interface Lead {
  _id: string
  name: string
  email?: string
  phone?: string
  source?: string
  status: 'New' | 'Contacted' | 'Interested' | 'Closed' | 'Lost'
  notes?: string
  createdAt?: string
}

const DealsPage = () => {
  const { user } = useAuthContext()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'Website',
    status: 'New' as Lead['status'],
    notes: '',
  })

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const res = await api.get('/erp/leads')
      setLeads(res.data || [])
    } catch {
      toast.error('Failed to load deals pipeline')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    try {
      await api.put(`/erp/leads/${leadId}`, {
        status: newStatus,
        userId: user?.id || user?._id || '',
        userName: user?.name || 'Admin',
      })
      toast.success(`Moved to ${newStatus}`)
      fetchLeads()
    } catch {
      toast.error('Failed to update deal')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/erp/leads', {
        ...formData,
        userId: user?.id || user?._id || '',
        userName: user?.name || 'Admin',
      })
      toast.success('Deal added')
      setShowModal(false)
      setFormData({ name: '', email: '', phone: '', source: 'Website', status: 'New', notes: '' })
      fetchLeads()
    } catch {
      toast.error('Failed to add deal')
    }
  }

  const handleDelete = async (leadId: string) => {
    if (!window.confirm('Delete this deal?')) return
    try {
      await api.delete(`/erp/leads/${leadId}`)
      toast.success('Deal deleted')
      fetchLeads()
    } catch {
      toast.error('Failed to delete deal')
    }
  }

  const getNextStatus = (current: Lead['status']): Lead['status'] | null => {
    switch (current) {
      case 'New': return 'Contacted'
      case 'Contacted': return 'Interested'
      case 'Interested': return 'Closed'
      default: return null
    }
  }

  const getPrevStatus = (current: Lead['status']): Lead['status'] | null => {
    switch (current) {
      case 'Contacted': return 'New'
      case 'Interested': return 'Contacted'
      case 'Closed': return 'Interested'
      default: return null
    }
  }

  const columns: { title: string; status: Lead['status']; color: string; icon: string }[] = [
    { title: 'New', status: 'New', color: '#0dcaf0', icon: 'bx:user-plus' },
    { title: 'Contacted', status: 'Contacted', color: '#FF4D00', icon: 'bx:phone-call' },
    { title: 'Interested', status: 'Interested', color: '#ffc107', icon: 'bx:heart' },
    { title: 'Closed', status: 'Closed', color: '#198754', icon: 'bx:check-circle' },
    { title: 'Lost', status: 'Lost', color: '#dc3545', icon: 'bx:x-circle' },
  ]

  return (
    <div className="crm-page">
      <Row className="align-items-end mb-4 g-3">
        <Col>
          <p className="text-muted text-uppercase small fw-bold mb-1">CRM</p>
          <h3 className="fw-bold mb-1">Deals Pipeline</h3>
          <p className="text-muted mb-0">Move opportunities across New → Contacted → Interested → Closed / Lost.</p>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button variant="primary" className="rounded-pill px-4" onClick={() => setShowModal(true)}>
            <IconifyIcon icon="bx:plus" className="me-1" /> Add Lead
          </Button>
          <Button variant="soft-secondary" onClick={fetchLeads} disabled={loading}>
            <IconifyIcon icon="bx:refresh" className="me-1" /> Refresh
          </Button>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5 text-muted">Loading deals pipeline...</div>
      ) : (
        <Row className="g-3 flex-nowrap overflow-auto pb-3" style={{ minHeight: '60vh' }}>
          {columns.map((col) => {
            const colLeads = leads.filter((l) => l.status === col.status)
            return (
              <Col key={col.status} style={{ minWidth: 260, maxWidth: 320 }}>
                <div
                  className="d-flex justify-content-between align-items-center mb-3 p-2 rounded border-start border-3"
                  style={{ borderLeftColor: col.color, background: 'var(--hoftrix-surface, #1e2229)' }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <IconifyIcon icon={col.icon} style={{ color: col.color }} />
                    <span className="fw-bold small text-uppercase">{col.title}</span>
                  </div>
                  <Badge bg="secondary" className="rounded-pill">{colLeads.length}</Badge>
                </div>

                <div className="d-flex flex-column gap-2">
                  {colLeads.length === 0 ? (
                    <div className="crm-empty py-4 border border-dashed rounded-3">
                      <p className="mb-0 small">Empty</p>
                    </div>
                  ) : (
                    colLeads.map((lead) => (
                      <Card key={lead._id} className="border-0 border-start border-3" style={{ borderLeftColor: col.color }}>
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="fw-bold mb-0">{lead.name}</h6>
                            <Button variant="soft-danger" size="sm" className="px-1 py-0" onClick={() => handleDelete(lead._id)}>
                              <IconifyIcon icon="bx:trash" />
                            </Button>
                          </div>
                          {lead.email && <div className="text-muted small mb-1"><IconifyIcon icon="bx:envelope" className="me-1" />{lead.email}</div>}
                          {lead.phone && <div className="text-muted small mb-2"><IconifyIcon icon="bx:phone" className="me-1" />{lead.phone}</div>}
                          {lead.notes && <p className="text-muted small mb-2">{lead.notes}</p>}
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex gap-1">
                              {getPrevStatus(lead.status) && (
                                <Button size="sm" variant="soft-secondary" onClick={() => handleStatusChange(lead._id, getPrevStatus(lead.status)!)}>
                                  <IconifyIcon icon="bx:chevron-left" />
                                </Button>
                              )}
                              {getNextStatus(lead.status) && (
                                <Button size="sm" variant="soft-primary" onClick={() => handleStatusChange(lead._id, getNextStatus(lead.status)!)}>
                                  <IconifyIcon icon="bx:chevron-right" />
                                </Button>
                              )}
                            </div>
                            {lead.status !== 'Closed' && lead.status !== 'Lost' && (
                              <div className="d-flex gap-1">
                                <Button size="sm" variant="soft-danger" onClick={() => handleStatusChange(lead._id, 'Lost')}>Lost</Button>
                                <Button size="sm" variant="soft-success" onClick={() => handleStatusChange(lead._id, 'Closed')}>Won</Button>
                              </div>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    ))
                  )}
                </div>
              </Col>
            )
          })}
        </Row>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Add Lead</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Source</Form.Label>
                  <Form.Select value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })}>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Direct Call">Direct Call</option>
                    <option value="Social Media">Social Media</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Stage</Form.Label>
                  <Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Lead['status'] })}>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interested">Interested</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group>
              <Form.Label>Notes</Form.Label>
              <Form.Control as="textarea" rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="soft-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Add Lead</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}

export default DealsPage
