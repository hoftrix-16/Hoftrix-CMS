'use client'
import { useEffect, useState } from 'react'
import { Card, Col, Row, Badge, Button, Modal, Form } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'
import { useAuthContext } from '@/context/useAuthContext'

interface Lead {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  status: 'New' | 'Contacted' | 'Interested' | 'Closed' | 'Lost';
  notes?: string;
  createdAt: string;
}

const KanbanPage = () => {
  const { user } = useAuthContext()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'Website',
    status: 'New' as 'New' | 'Contacted' | 'Interested' | 'Closed' | 'Lost',
    notes: '',
    userId: user?.id || user?._id || '',
    userName: user?.name || 'Admin'
  })

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const response = await api.get('/erp/leads')
      setLeads(response.data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Failed to load leads pipeline')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const payload = {
        status: newStatus,
        userId: user?.id || user?._id || '',
        userName: user?.name || 'Admin'
      }
      await api.put(`/erp/leads/${leadId}`, payload)
      toast.success(`Lead moved to ${newStatus}`)
      fetchLeads()
    } catch (error) {
      toast.error('Failed to move lead stage')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        userId: user?.id || user?._id || '',
        userName: user?.name || 'Admin'
      }
      await api.post('/erp/leads', payload)
      toast.success('New Lead added to Pipeline!')
      setShowModal(false)
      fetchLeads()
      resetForm()
    } catch (error) {
      toast.error('Failed to register lead')
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return
    try {
      await api.delete(`/erp/leads/${leadId}`)
      toast.success('Lead deleted successfully!')
      fetchLeads()
    } catch (error) {
      toast.error('Failed to delete lead')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      source: 'Website',
      status: 'New',
      notes: '',
      userId: user?.id || user?._id || '',
      userName: user?.name || 'Admin'
    })
  }

  const getSourceBadgeColor = (source?: string) => {
    const src = source?.toLowerCase() || ''
    if (src.includes('web')) return 'primary'
    if (src.includes('referral')) return 'success'
    if (src.includes('social') || src.includes('facebook') || src.includes('linkedin')) return 'info'
    return 'secondary'
  }

  const columns: { title: string; status: Lead['status']; color: string; icon: string }[] = [
    { title: 'New Leads', status: 'New', color: '#0dcaf0', icon: 'bx:user-plus' },
    { title: 'Contacted', status: 'Contacted', color: '#FF4D00', icon: 'bx:phone-call' },
    { title: 'Interested', status: 'Interested', color: '#ffc107', icon: 'bx:heart' },
    { title: 'Closed / Won', status: 'Closed', color: '#198754', icon: 'bx:party' },
    { title: 'Lost', status: 'Lost', color: '#dc3545', icon: 'bx:x-circle' }
  ]

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

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h3 className="fw-bold text-uppercase m-0">Sales Pipeline</h3>
          <p className="text-muted small mb-0">Organize sales deals, incoming leads, and status pipelines.</p>
        </div>
        <div className="crm-page-actions">
          <Button
            variant="primary"
            className="rounded-pill shadow px-4 fw-bold"
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            <IconifyIcon icon="bx:plus" className="me-1" /> Add Lead
          </Button>
          <Button
            variant="soft-secondary"
            className="rounded-pill px-3 fw-bold"
            onClick={fetchLeads}
            disabled={loading}
          >
            <IconifyIcon icon="bx:refresh" className={`me-1 ${loading ? 'spin-anim' : ''}`} /> Refresh Board
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-5 text-center">
          <h5 className="text-muted animate__animated animate__pulse animate__infinite">
            Loading leads pipeline...
          </h5>
        </div>
      ) : (
        <Row className="kanban-row crm-pipeline g-3 flex-nowrap overflow-auto pb-3" style={{ minHeight: '65vh' }}>
          {columns.map(col => {
            const colLeads = leads.filter(l => l.status === col.status)
            return (
              <Col key={col.status} className="kanban-column" style={{ minWidth: '280px', maxWidth: '350px' }}>
                <div className="kanban-column-header d-flex justify-content-between align-items-center mb-3 p-2 rounded bg-light border-start border-3" style={{ borderLeftColor: col.color + ' !important' }}>
                  <div className="d-flex align-items-center gap-2">
                    <IconifyIcon icon={col.icon} className="fs-18" style={{ color: col.color }} />
                    <span className="fw-bold text-dark small text-uppercase">{col.title}</span>
                  </div>
                  <Badge bg="secondary" className="rounded-pill">{colLeads.length}</Badge>
                </div>

                <div className="kanban-cards-container d-flex flex-column gap-2.5 overflow-auto" style={{ maxHeight: '60vh' }}>
                  {colLeads.length > 0 ? (
                    colLeads.map(lead => (
                      <Card key={lead._id} className="kanban-card border-0 border-start border-3 shadow-sm rounded-3 transition-hover" style={{ borderLeftColor: col.color }}>
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="fw-bold text-dark mb-0">{lead.name}</h6>
                            <div className="d-flex align-items-center gap-1">
                              <Badge bg={getSourceBadgeColor(lead.source)} className="rounded-pill fs-9 text-uppercase">
                                {lead.source || 'Website'}
                              </Badge>
                              <Button
                                variant="soft-danger"
                                size="sm"
                                className="px-1 py-0 rounded"
                                onClick={() => handleDeleteLead(lead._id)}
                                title="Delete Lead"
                              >
                                <IconifyIcon icon="bx:trash" className="fs-11" />
                              </Button>
                            </div>
                          </div>
                          
                          {lead.email && <div className="text-muted small mb-1"><IconifyIcon icon="bx:envelope" className="me-1 fs-11" />{lead.email}</div>}
                          {lead.phone && <div className="text-muted small mb-2"><IconifyIcon icon="bx:phone" className="me-1 fs-11" />{lead.phone}</div>}
                          
                          {lead.notes && (
                            <p className="text-secondary small bg-light p-2 rounded mb-3 text-truncate-2">
                              {lead.notes}
                            </p>
                          )}

                          <div className="d-flex justify-content-between align-items-center mt-2.5">
                            {/* Action Buttons for Stage Transitions */}
                            <div className="d-flex gap-1.5">
                              {getPrevStatus(lead.status) && (
                                <Button 
                                  variant="soft-secondary" 
                                  size="sm" 
                                  className="px-1.5 py-0.5 rounded"
                                  onClick={() => handleStatusChange(lead._id, getPrevStatus(lead.status)!)}
                                  title="Move to Previous Stage"
                                >
                                  <IconifyIcon icon="bx:chevron-left" />
                                </Button>
                              )}
                              {getNextStatus(lead.status) && (
                                <Button 
                                  variant="soft-primary" 
                                  size="sm" 
                                  className="px-1.5 py-0.5 rounded"
                                  onClick={() => handleStatusChange(lead._id, getNextStatus(lead.status)!)}
                                  title="Advance Stage"
                                >
                                  <IconifyIcon icon="bx:chevron-right" />
                                </Button>
                              )}
                            </div>
                            
                            {/* Terminal Stages Quick Set */}
                            <div className="d-flex gap-1">
                              {lead.status !== 'Closed' && lead.status !== 'Lost' && (
                                <>
                                  <Button 
                                    variant="soft-danger" 
                                    size="sm" 
                                    className="px-1.5 py-0.5 rounded fs-9 fw-bold"
                                    onClick={() => handleStatusChange(lead._id, 'Lost')}
                                    title="Mark as Lost"
                                  >
                                    Lost
                                  </Button>
                                  <Button 
                                    variant="soft-success" 
                                    size="sm" 
                                    className="px-1.5 py-0.5 rounded fs-9 fw-bold"
                                    onClick={() => handleStatusChange(lead._id, 'Closed')}
                                    title="Mark as Won"
                                  >
                                    Won
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted small bg-light rounded-3 border border-dashed border-2">
                      Empty Column
                    </div>
                  )}
                </div>
              </Col>
            )
          })}
        </Row>
      )}

      {/* Add Lead Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-uppercase fs-16 text-primary">Add Lead to Sales Pipeline</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">LEAD NAME</Form.Label>
              <Form.Control required type="text" placeholder="e.g. John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">EMAIL</Form.Label>
                  <Form.Control type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">PHONE</Form.Label>
                  <Form.Control type="text" placeholder="+123456789" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">SOURCE</Form.Label>
                  <Form.Select value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})}>
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
                  <Form.Label className="small fw-bold">INITIAL STAGE</Form.Label>
                  <Form.Select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})}>
                    <option value="New">New Lead</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interested">Interested</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">NOTES & BRIEF DETAILS</Form.Label>
              <Form.Control as="textarea" rows={3} placeholder="Requirements, client specs, budget..." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0 justify-content-center">
            <Button variant="primary" type="submit" className="w-50 rounded-pill shadow fw-bold py-2 text-uppercase">
              Add Card
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style>{`
        .transition-hover {
          transition: all 0.25s ease-in-out;
        }
        .transition-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.08) !important;
        }
        .gap-1.5 { gap: 6px; }
        .gap-2.5 { gap: 10px; }
        .mt-2.5 { margin-top: 10px; }
        .px-1.5 { padding-left: 6px; padding-right: 6px; }
        .py-0.5 { padding-top: 2px; padding-bottom: 2px; }
        .fs-18 { font-size: 18px; }
        .fs-11 { font-size: 11px; }
        .fs-9 { font-size: 9px; }
        .text-truncate-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;  
          overflow: hidden;
        }
        .spin-anim { animation: spin 1s linear infinite; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Custom scrollbar styling for Kanban board */
        .kanban-row::-webkit-scrollbar {
          height: 8px;
        }
        .kanban-row::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .kanban-row::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .kanban-row::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  )
}

export default KanbanPage
