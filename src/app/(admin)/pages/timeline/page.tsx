'use client'
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, Col, Row, ProgressBar, Button, Badge, Modal, Form } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

interface User {
  _id: string;
  name: string;
}

interface Project {
  _id: string;
  name: string;
  progress: number;
  status: string;
  deadline: string;
  client?: { name: string };
  customClientName?: string;
}

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<User[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', client: '', customClientName: '', deadline: '', status: 'Planning', progress: 0 })

  const fetchData = async () => {
    try {
      const projRes = await api.get('/erp/projects')
      setProjects(projRes.data)
      const clientRes = await api.get('/auth/clients')
      setClients(clientRes.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/erp/projects', formData)
      toast.success('Project created successfully!')
      setShowModal(false)
      fetchData()
      setFormData({ name: '', client: '', customClientName: '', deadline: '', status: 'Planning', progress: 0 })
    } catch (err) { toast.error('Failed to create project') }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success'
      case 'In Progress': return 'primary'
      case 'Testing': return 'warning'
      default: return 'secondary'
    }
  }

  return (
    <div className="p-4">
      <Row className="align-items-center mb-4">
        <Col>
          <h3 className="fw-bold text-dark text-uppercase tracking-wider">Hoftrix Project Tracker</h3>
          <p className="text-muted small">Real-time status and delivery management for your clients.</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" className="rounded-pill shadow px-4 fw-bold shadow-lg" onClick={() => setShowModal(true)}>
            <IconifyIcon icon="bx:plus" className="me-1" /> New Project
          </Button>
        </Col>
      </Row>

      <Row>
        {projects.length > 0 ? (
          projects.map((proj) => (
            <Col md={6} xl={4} key={proj._id} className="mb-4">
              <Card className="border-0 shadow-sm h-100 rounded-4 overflow-hidden border-top border-4 border-primary">
                <CardHeader className="bg-white border-0 d-flex justify-content-between align-items-center pt-3 pb-0">
                  <Badge bg={getStatusColor(proj.status)} className="rounded-pill px-3 py-1 small">{proj.status}</Badge>
                  <span className="text-muted extra-small">
                     <IconifyIcon icon="bx:calendar" className="me-1" />
                     {new Date(proj.deadline).toLocaleDateString()}
                  </span>
                </CardHeader>
                <Card.Body>
                  <CardTitle className="fw-bold fs-18 mb-1">{proj.name}</CardTitle>
                  <p className="text-muted small mb-4">Client: <span className="text-dark fw-bold">{proj.client?.name || proj.customClientName || 'N/A'}</span></p>
                  
                  <div className="mb-2 d-flex justify-content-between align-items-center">
                    <span className="small text-muted fw-bold text-uppercase">Work Status</span>
                    <span className="small fw-bold text-primary">{proj.progress}%</span>
                  </div>
                  <ProgressBar now={proj.progress} variant="primary" style={{ height: '10px' }} className="rounded-pill bg-light shadow-none" />
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col xs={12} className="text-center p-5">
             <div className="avatar-xl bg-soft-primary text-primary rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center">
                <IconifyIcon icon="bx:rocket" className="fs-48" />
             </div>
             <h4 className="fw-bold text-dark">No Projects Tracked Yet</h4>
             <Button variant="outline-primary" className="mt-3 px-4 rounded-pill" onClick={() => setShowModal(true)}>Add Your First Project</Button>
          </Col>
        )}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-primary text-uppercase fs-16">New Project Setup</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-uppercase">Project Name</Form.Label>
              <Form.Control required type="text" placeholder="e.g. Website Development" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-uppercase">Select Client (Existing)</Form.Label>
              <Form.Select value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value, customClientName: ''})}>
                <option value="">Select a client...</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Form.Select>
            </Form.Group>

            <div className="text-center my-2 position-relative">
               <hr/><span className="position-absolute top-50 start-50 translate-middle bg-white px-2 extra-small text-muted">OR TYPE NAME</span>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-uppercase">Custom Client Name</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Type name manually..." 
                disabled={!!formData.client}
                value={formData.customClientName}
                onChange={(e) => setFormData({...formData, customClientName: e.target.value})} 
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-uppercase">Target Deadline</Form.Label>
                  <Form.Control required type="date" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-uppercase">Progress %</Form.Label>
                  <Form.Control type="number" min="0" max="100" value={formData.progress} onChange={(e) => setFormData({...formData, progress: parseInt(e.target.value)})} />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="px-5 shadow rounded-pill">Launch Project</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}

export default ProjectsPage
