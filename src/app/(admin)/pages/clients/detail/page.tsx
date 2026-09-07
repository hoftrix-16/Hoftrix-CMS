'use client'
import { useCallback, useEffect, useState } from 'react'
import { Badge, Button, Card, Col, Form, Modal, Nav, Row, Spinner, Tab, Table } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

interface FollowUp {
  _id: string
  title: string
  dueDate?: string
  status?: string
  note?: string
}

interface ClientDetail {
  _id: string
  companyName: string
  contactPerson?: string
  email?: string
  phone?: string
  website?: string
  industry?: string
  status: string
  servicesPurchased?: string[]
  assignedToName?: string
  totalRevenue?: number
  pendingAmount?: number
  pendingInvoices?: number
  activeProjects?: number
  projects?: any[]
  invoices?: any[]
  documents?: { _id: string; name: string; url: string; createdAt?: string }[]
  timeline?: { _id: string; type?: string; title?: string; description?: string; date?: string; createdAt?: string }[]
  notes?: { _id: string; text: string; createdAt?: string; createdByName?: string }[]
  followUps?: FollowUp[]
}

const statusColor = (status: string) => {
  if (status === 'Active') return 'success'
  if (status === 'Prospect') return 'warning'
  return 'secondary'
}

const ClientDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const [showFollowUp, setShowFollowUp] = useState(false)
  const [showDocument, setShowDocument] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [showProject, setShowProject] = useState(false)
  const [showEditClient, setShowEditClient] = useState(false)
  const [saving, setSaving] = useState(false)

  const [followUpForm, setFollowUpForm] = useState({ title: '', dueDate: '', note: '' })
  const [docForm, setDocForm] = useState({ name: '', url: '' })
  const [activityForm, setActivityForm] = useState({ type: 'Call', title: '', description: '' })
  const [noteText, setNoteText] = useState('')
  const [projectForm, setProjectForm] = useState({
    name: '',
    technology: '',
    deadline: '',
    status: 'Planning',
    description: '',
  })
  const [editForm, setEditForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    status: 'Active',
    assignedToName: '',
  })

  const fetchClient = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await api.get(`/erp/clients/${id}`)
      setClient(res.data)
    } catch {
      toast.error('Failed to load client')
      setClient(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  const markFollowUpDone = async (followUpId: string) => {
    if (!id) return
    try {
      await api.put(`/erp/clients/${id}/follow-ups/${followUpId}`, { status: 'Done' })
      toast.success('Follow-up marked done')
      fetchClient()
    } catch {
      toast.error('Failed to update follow-up')
    }
  }

  const addFollowUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      await api.post(`/erp/clients/${id}/follow-ups`, followUpForm)
      toast.success('Follow-up added')
      setShowFollowUp(false)
      setFollowUpForm({ title: '', dueDate: '', note: '' })
      fetchClient()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add follow-up')
    } finally {
      setSaving(false)
    }
  }

  const addDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      await api.post(`/erp/clients/${id}/documents`, docForm)
      toast.success('Document added')
      setShowDocument(false)
      setDocForm({ name: '', url: '' })
      fetchClient()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add document')
    } finally {
      setSaving(false)
    }
  }

  const addActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      await api.post(`/erp/clients/${id}/timeline`, activityForm)
      toast.success('Activity logged')
      setShowActivity(false)
      setActivityForm({ type: 'Call', title: '', description: '' })
      fetchClient()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add activity')
    } finally {
      setSaving(false)
    }
  }

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      await api.post(`/erp/clients/${id}/notes`, { text: noteText })
      toast.success('Note added')
      setShowNote(false)
      setNoteText('')
      fetchClient()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add note')
    } finally {
      setSaving(false)
    }
  }

  const openEditClient = () => {
    if (!client) return
    setEditForm({
      companyName: client.companyName || '',
      contactPerson: client.contactPerson || '',
      email: client.email || '',
      phone: client.phone || '',
      website: client.website || '',
      industry: client.industry || '',
      status: client.status || 'Active',
      assignedToName: client.assignedToName || '',
    })
    setShowEditClient(true)
  }

  const saveClientEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      await api.put(`/erp/clients/${id}`, editForm)
      toast.success('Client updated')
      setShowEditClient(false)
      fetchClient()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update client')
    } finally {
      setSaving(false)
    }
  }

  const addProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !client) return
    setSaving(true)
    try {
      await api.post('/erp/projects', {
        ...projectForm,
        client: id,
        customClientName: client.companyName,
        progress: 0,
      })
      toast.success('Project added for this client')
      setShowProject(false)
      setProjectForm({ name: '', technology: '', deadline: '', status: 'Planning', description: '' })
      setActiveTab('projects')
      fetchClient()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add project')
    } finally {
      setSaving(false)
    }
  }

  const goCreateInvoice = () => {
    if (!id) return
    navigate(`/pages/invoices/new?clientId=${id}`)
  }

  if (loading) {
    return (
      <div className="crm-page text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="crm-page">
        <div className="crm-empty">
          <div className="crm-empty-icon"><IconifyIcon icon="iconamoon:profile-circle-duotone" /></div>
          <h5 className="fw-bold">Client not found</h5>
          <Button as={Link as any} to="/pages/clients" variant="primary" className="rounded-pill px-4 mt-2">
            Back to Clients
          </Button>
        </div>
      </div>
    )
  }

  const initial = (client.companyName || '?').charAt(0).toUpperCase()
  const projects = client.projects || []
  const invoices = client.invoices || []
  const documents = client.documents || []
  const timeline = client.timeline || []
  const notes = client.notes || []
  const followUps = client.followUps || []
  const upcoming = followUps.filter((f) => f.status !== 'Done')

  return (
    <div className="crm-page">
      <div className="mb-3">
        <Link to="/pages/clients" className="text-muted text-decoration-none small fw-semibold">
          <IconifyIcon icon="bx:arrow-back" className="me-1" /> Back to Clients
        </Link>
      </div>

      <Card className="border-0 mb-4">
        <Card.Body className="p-4">
          <Row className="align-items-center g-3">
            <Col xs="auto">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold fs-3"
                style={{
                  width: 72,
                  height: 72,
                  background: 'rgba(255, 77, 0, 0.15)',
                  color: '#FF4D00',
                }}
              >
                {initial}
              </div>
            </Col>
            <Col>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <h3 className="fw-bold mb-0">{client.companyName}</h3>
                <Badge bg={statusColor(client.status)} className="rounded-pill px-3">{client.status}</Badge>
              </div>
              <div className="text-muted small d-flex flex-wrap gap-3">
                {client.contactPerson && (
                  <span><IconifyIcon icon="bx:user" className="me-1" />{client.contactPerson}</span>
                )}
                {client.email && (
                  <span><IconifyIcon icon="bx:envelope" className="me-1" />{client.email}</span>
                )}
                {client.phone && (
                  <span><IconifyIcon icon="bx:phone" className="me-1" />{client.phone}</span>
                )}
                {client.website && (
                  <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noreferrer" className="text-muted text-decoration-none">
                    <IconifyIcon icon="bx:link" className="me-1" />{client.website}
                  </a>
                )}
              </div>
              {client.assignedToName && (
                <div className="text-muted small mt-1">Assigned to <strong>{client.assignedToName}</strong></div>
              )}
            </Col>
            <Col xs={12} lg="auto" className="d-flex flex-wrap gap-2">
              <Button variant="outline-secondary" size="sm" className="rounded-pill" onClick={openEditClient}>
                <IconifyIcon icon="bx:edit" className="me-1" /> Edit Client
              </Button>
              <Button variant="outline-primary" size="sm" className="rounded-pill" onClick={() => setShowProject(true)}>
                <IconifyIcon icon="bx:briefcase" className="me-1" /> Add Project
              </Button>
              <Button variant="primary" size="sm" className="rounded-pill" onClick={goCreateInvoice}>
                <IconifyIcon icon="bx:receipt" className="me-1" /> New Invoice
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="crm-stat-grid">
        <div className="crm-stat-card">
          <div className="crm-stat-label">Total Revenue</div>
          <p className="crm-stat-value">₹{(client.totalRevenue || 0).toLocaleString()}</p>
        </div>
        <div className="crm-stat-card">
          <div className="crm-stat-label">Pending Amount</div>
          <p className="crm-stat-value">₹{(client.pendingAmount || 0).toLocaleString()}</p>
        </div>
        <div className="crm-stat-card">
          <div className="crm-stat-label">Projects</div>
          <p className="crm-stat-value">{projects.length || client.activeProjects || 0}</p>
        </div>
        <div className="crm-stat-card">
          <div className="crm-stat-label">Pending Invoices</div>
          <p className="crm-stat-value">{client.pendingInvoices || invoices.filter((i) => ['Unpaid', 'Pending', 'Sent', 'Overdue'].includes(i.status)).length}</p>
        </div>
      </div>

      <Card className="border-0">
        <Card.Body className="p-0">
          <Tab.Container activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)}>
            <Nav variant="tabs" className="crm-tabs px-3 pt-2">
              <Nav.Item><Nav.Link eventKey="overview">Overview</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link eventKey="projects">Projects</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link eventKey="invoices">Invoices</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link eventKey="documents">Documents</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link eventKey="activities">Activities</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link eventKey="notes">Notes</Nav.Link></Nav.Item>
            </Nav>

            <Tab.Content className="p-4">
              <Tab.Pane eventKey="overview">
                <Row className="g-4">
                  <Col lg={6}>
                    <h6 className="fw-bold mb-3">Company Details</h6>
                    <div className="mb-2"><span className="text-muted small">Industry</span><div className="fw-medium">{client.industry || '—'}</div></div>
                    <div className="mb-2"><span className="text-muted small">Contact</span><div className="fw-medium">{client.contactPerson || '—'}</div></div>
                    <div className="mb-2"><span className="text-muted small">Email</span><div className="fw-medium">{client.email || '—'}</div></div>
                    <div className="mb-3"><span className="text-muted small">Phone</span><div className="fw-medium">{client.phone || '—'}</div></div>
                    <div className="mb-2"><span className="text-muted small">Services Purchased</span></div>
                    <div className="d-flex flex-wrap gap-2">
                      {(client.servicesPurchased || []).length === 0 ? (
                        <span className="text-muted small">None listed</span>
                      ) : (
                        client.servicesPurchased!.map((s) => (
                          <Badge key={s} bg="soft-primary" className="text-primary rounded-pill px-3">{s}</Badge>
                        ))
                      )}
                    </div>
                  </Col>
                  <Col lg={6}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">Upcoming Follow-ups</h6>
                      <Button size="sm" variant="primary" className="rounded-pill" onClick={() => setShowFollowUp(true)}>
                        <IconifyIcon icon="bx:plus" className="me-1" /> Add
                      </Button>
                    </div>
                    {upcoming.length === 0 ? (
                      <div className="crm-empty py-4">
                        <p className="mb-0 small">No pending follow-ups</p>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {upcoming.map((f) => (
                          <div key={f._id} className="d-flex justify-content-between align-items-start border rounded-3 p-3">
                            <div>
                              <div className="fw-semibold">{f.title}</div>
                              <div className="text-muted small">
                                {f.dueDate ? new Date(f.dueDate).toLocaleDateString() : 'No due date'}
                                {f.note ? ` · ${f.note}` : ''}
                              </div>
                            </div>
                            <Button size="sm" variant="soft-success" onClick={() => markFollowUpDone(f._id)}>
                              Done
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Col>
                </Row>
              </Tab.Pane>

              <Tab.Pane eventKey="projects">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="fw-bold mb-0">Client Projects</h6>
                    <p className="text-muted small mb-0">Projects linked to this client account</p>
                  </div>
                  <Button size="sm" variant="primary" className="rounded-pill" onClick={() => setShowProject(true)}>
                    <IconifyIcon icon="bx:plus" className="me-1" /> Add Project
                  </Button>
                </div>
                {projects.length === 0 ? (
                  <div className="crm-empty">
                    <div className="crm-empty-icon"><IconifyIcon icon="bx:briefcase" /></div>
                    <h6 className="fw-bold">No projects linked</h6>
                    <p className="small text-muted mb-3">Add a project for this client to track delivery here.</p>
                    <Button variant="primary" className="rounded-pill px-4" onClick={() => setShowProject(true)}>
                      <IconifyIcon icon="bx:plus" className="me-1" /> Add Project
                    </Button>
                  </div>
                ) : (
                  <Table responsive hover className="mb-0 align-middle">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Deadline</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((p: any) => (
                        <tr key={p._id}>
                          <td className="fw-semibold">{p.name || p.projectName || '—'}</td>
                          <td><Badge bg={p.status === 'Completed' ? 'success' : 'secondary'} className="rounded-pill">{p.status || '—'}</Badge></td>
                          <td>{p.status === 'Completed' ? 100 : (p.progress || 0)}%</td>
                          <td className="text-muted small">{p.deadline || p.dueDate ? new Date(p.deadline || p.dueDate).toLocaleDateString() : '—'}</td>
                          <td className="text-end">
                            <Button
                              size="sm"
                              variant="soft-primary"
                              as={Link as any}
                              to={`/pages/projects?status=${p.status === 'Completed' ? 'completed' : 'active'}`}
                            >
                              Open
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Tab.Pane>

              <Tab.Pane eventKey="invoices">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="fw-bold mb-0">Client Invoices</h6>
                    <p className="text-muted small mb-0">Billing records for this client</p>
                  </div>
                  <Button size="sm" variant="primary" className="rounded-pill" onClick={goCreateInvoice}>
                    <IconifyIcon icon="bx:plus" className="me-1" /> New Invoice
                  </Button>
                </div>
                {invoices.length === 0 ? (
                  <div className="crm-empty">
                    <div className="crm-empty-icon"><IconifyIcon icon="bx:receipt" /></div>
                    <h6 className="fw-bold">No invoices yet</h6>
                    <p className="small text-muted mb-3">Create an invoice for this client — details will auto-fill.</p>
                    <Button variant="primary" className="rounded-pill px-4" onClick={goCreateInvoice}>
                      <IconifyIcon icon="bx:plus" className="me-1" /> New Invoice
                    </Button>
                  </div>
                ) : (
                  <Table responsive hover className="mb-0 align-middle">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Subject</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Due</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv: any) => (
                        <tr key={inv._id}>
                          <td className="fw-semibold">{inv.invoiceNumber || '—'}</td>
                          <td>{inv.subject || '—'}</td>
                          <td>₹{(inv.totalAmount || 0).toLocaleString()}</td>
                          <td>
                            <Badge bg={inv.status === 'Paid' ? 'success' : inv.status === 'Cancelled' ? 'secondary' : 'warning'} className="rounded-pill">
                              {inv.status || '—'}
                            </Badge>
                          </td>
                          <td className="text-muted small">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                          <td className="text-end">
                            <Button size="sm" variant="soft-primary" as={Link as any} to={`/pages/invoices/${inv._id}`}>
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Tab.Pane>

              <Tab.Pane eventKey="documents">
                <div className="d-flex justify-content-end mb-3">
                  <Button size="sm" variant="primary" className="rounded-pill" onClick={() => setShowDocument(true)}>
                    <IconifyIcon icon="bx:plus" className="me-1" /> Add Document
                  </Button>
                </div>
                {documents.length === 0 ? (
                  <div className="crm-empty"><p className="mb-0">No documents yet</p></div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {documents.map((d) => (
                      <div key={d._id} className="d-flex justify-content-between align-items-center border rounded-3 p-3">
                        <div>
                          <div className="fw-semibold">{d.name}</div>
                          <a href={d.url} target="_blank" rel="noreferrer" className="small text-primary text-decoration-none">{d.url}</a>
                        </div>
                        <IconifyIcon icon="bx:link-external" className="text-muted" />
                      </div>
                    ))}
                  </div>
                )}
              </Tab.Pane>

              <Tab.Pane eventKey="activities">
                <div className="d-flex justify-content-end mb-3">
                  <Button size="sm" variant="primary" className="rounded-pill" onClick={() => setShowActivity(true)}>
                    <IconifyIcon icon="bx:plus" className="me-1" /> Log Activity
                  </Button>
                </div>
                {timeline.length === 0 ? (
                  <div className="crm-empty"><p className="mb-0">No activities yet</p></div>
                ) : (
                  <ul className="crm-timeline">
                    {timeline.map((t) => (
                      <li key={t._id}>
                        <div className="fw-semibold">{t.title || t.type || 'Activity'}</div>
                        {t.description && <div className="text-muted small">{t.description}</div>}
                        <div className="text-muted small mt-1">
                          {t.type && <Badge bg="soft-secondary" className="me-2">{t.type}</Badge>}
                          {t.date || t.createdAt ? new Date(t.date || t.createdAt!).toLocaleString() : ''}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Tab.Pane>

              <Tab.Pane eventKey="notes">
                <div className="d-flex justify-content-end mb-3">
                  <Button size="sm" variant="primary" className="rounded-pill" onClick={() => setShowNote(true)}>
                    <IconifyIcon icon="bx:plus" className="me-1" /> Add Note
                  </Button>
                </div>
                {notes.length === 0 ? (
                  <div className="crm-empty"><p className="mb-0">No notes yet</p></div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {notes.map((n) => (
                      <div key={n._id} className="border rounded-3 p-3">
                        <p className="mb-1">{n.text}</p>
                        <div className="text-muted small">
                          {n.createdByName ? `${n.createdByName} · ` : ''}
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Card.Body>
      </Card>

      <Modal show={showFollowUp} onHide={() => setShowFollowUp(false)} centered>
        <Modal.Header closeButton><Modal.Title className="fw-bold">Add Follow-up</Modal.Title></Modal.Header>
        <Form onSubmit={addFollowUp}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control required value={followUpForm.title} onChange={(e) => setFollowUpForm({ ...followUpForm, title: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control type="date" value={followUpForm.dueDate} onChange={(e) => setFollowUpForm({ ...followUpForm, dueDate: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Note</Form.Label>
              <Form.Control as="textarea" rows={2} value={followUpForm.note} onChange={(e) => setFollowUpForm({ ...followUpForm, note: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="soft-secondary" onClick={() => setShowFollowUp(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Follow-up'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showDocument} onHide={() => setShowDocument(false)} centered>
        <Modal.Header closeButton><Modal.Title className="fw-bold">Add Document</Modal.Title></Modal.Header>
        <Form onSubmit={addDocument}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control required value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>URL *</Form.Label>
              <Form.Control required type="url" placeholder="https://..." value={docForm.url} onChange={(e) => setDocForm({ ...docForm, url: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="soft-secondary" onClick={() => setShowDocument(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Document'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showActivity} onHide={() => setShowActivity(false)} centered>
        <Modal.Header closeButton><Modal.Title className="fw-bold">Log Activity</Modal.Title></Modal.Header>
        <Form onSubmit={addActivity}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select value={activityForm.type} onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}>
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="Meeting">Meeting</option>
                <option value="Note">Note</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control required value={activityForm.title} onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={activityForm.description} onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="soft-secondary" onClick={() => setShowActivity(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Log Activity'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showNote} onHide={() => setShowNote(false)} centered>
        <Modal.Header closeButton><Modal.Title className="fw-bold">Add Note</Modal.Title></Modal.Header>
        <Form onSubmit={addNote}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Note *</Form.Label>
              <Form.Control as="textarea" rows={4} required value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="soft-secondary" onClick={() => setShowNote(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Note'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showProject} onHide={() => setShowProject(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Add Project for {client.companyName}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={addProject}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Project Name *</Form.Label>
              <Form.Control required value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} placeholder="e.g. Shopify Website" />
            </Form.Group>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Technology</Form.Label>
                  <Form.Control value={projectForm.technology} onChange={(e) => setProjectForm({ ...projectForm, technology: e.target.value })} placeholder="Shopify, React, etc." />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Deadline</Form.Label>
                  <Form.Control type="date" value={projectForm.deadline} onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}>
                    <option>Planning</option>
                    <option>In Progress</option>
                    <option>Testing</option>
                    <option>On Hold</option>
                    <option>Completed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" rows={3} value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="soft-secondary" onClick={() => setShowProject(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Project'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showEditClient} onHide={() => setShowEditClient(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">Edit Client</Modal.Title></Modal.Header>
        <Form onSubmit={saveClientEdit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Company Name *</Form.Label>
                <Form.Control required value={editForm.companyName} onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })} />
              </Col>
              <Col md={6}>
                <Form.Label>Contact Person</Form.Label>
                <Form.Control value={editForm.contactPerson} onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })} />
              </Col>
              <Col md={6}>
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </Col>
              <Col md={6}>
                <Form.Label>Phone</Form.Label>
                <Form.Control value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </Col>
              <Col md={6}>
                <Form.Label>Website</Form.Label>
                <Form.Control value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} />
              </Col>
              <Col md={6}>
                <Form.Label>Industry</Form.Label>
                <Form.Control value={editForm.industry} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })} />
              </Col>
              <Col md={6}>
                <Form.Label>Status</Form.Label>
                <Form.Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="Active">Active</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Inactive">Inactive</option>
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label>Assigned To</Form.Label>
                <Form.Control value={editForm.assignedToName} onChange={(e) => setEditForm({ ...editForm, assignedToName: e.target.value })} />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="soft-secondary" onClick={() => setShowEditClient(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Update Client'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}

export default ClientDetailPage
