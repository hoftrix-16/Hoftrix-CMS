'use client'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Col, Row, ProgressBar, Button, Badge, Modal, Form, ListGroup } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

interface Task {
  _id?: string;
  title: string;
  isCompleted: boolean;
  assignedToName?: string;
  priority?: 'Low' | 'Medium' | 'High';
}

interface Project {
  _id: string;
  name: string;
  progress: number;
  status: string;
  deadline: string;
  description: string;
  client?: { name?: string; companyName?: string };
  customClientName?: string;
  tasks: Task[];
  technology?: string;
  clientWebsite?: string;
  clientPhone?: string;
  clientEmail?: string;
}

const ProjectsPage = () => {
  const [searchParams] = useSearchParams()
  const statusFilter = (searchParams.get('status') || 'active').toLowerCase()
  const isCompletedView = statusFilter === 'completed'

  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  
  const [formData, setFormData] = useState({ 
    name: '', client: '', customClientName: '', 
    deadline: '', status: 'Planning', progress: 0, description: '', technology: '',
    clientWebsite: '', clientPhoneCode: '+91', clientPhone: '', clientEmail: ''
  })

  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '', client: '', customClientName: '', 
    deadline: '', status: 'Planning', progress: 0, description: '', technology: '',
    clientWebsite: '', editPhoneCode: '+91', clientPhone: '', clientEmail: ''
  })

  const [employees, setEmployees] = useState<any[]>([])
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('Medium')

  const visibleProjects = useMemo(() => {
    if (isCompletedView) {
      return projects.filter((p) => p.status === 'Completed')
    }
    return projects.filter((p) => p.status !== 'Completed')
  }, [projects, isCompletedView])

  // CSV EXPORT UTILITY
  const exportToCSV = () => {
    if (visibleProjects.length === 0) {
      toast.error('No projects available to export.')
      return
    }

    const headers = [
      'Project Name',
      'Client Name',
      'Technology/Platform',
      'Description',
      'Status',
      'Deadline',
      'Progress %',
      'Client Website',
      'Client Phone',
      'Client Email',
      'Tasks Count'
    ]

    const rows = visibleProjects.map(proj => {
      const clientName = proj.client?.companyName || proj.customClientName || ''
      const progressVal = proj.status === 'Completed' ? 100 : proj.progress || 0
      const deadlineStr = proj.deadline ? new Date(proj.deadline).toLocaleDateString() : ''
      const tasksCount = proj.tasks?.length || 0

      const formatCSVCell = (val: any) => {
        const text = String(val === null || val === undefined ? '' : val)
        return '"' + text.replace(/"/g, '""') + '"'
      }

      return [
        formatCSVCell(proj.name),
        formatCSVCell(clientName),
        formatCSVCell(proj.technology),
        formatCSVCell(proj.description),
        formatCSVCell(proj.status),
        formatCSVCell(deadlineStr),
        formatCSVCell(progressVal + '%'),
        formatCSVCell(proj.clientWebsite),
        formatCSVCell(proj.clientPhone),
        formatCSVCell(proj.clientEmail),
        formatCSVCell(tasksCount)
      ].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `hoftrix_projects_export_${new Date().toISOString().slice(0,10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Projects exported as CSV successfully!')
  }

  const fetchData = async () => {
    try {
      const projRes = await api.get('/erp/projects')
      setProjects(projRes.data)
      const clientRes = await api.get('/erp/clients')
      setClients(clientRes.data)
      const empRes = await api.get('/erp/employees')
      setEmployees(empRes.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const submissionData = { 
      ...formData,
      progress: formData.status === 'Completed' ? 100 : formData.progress,
      clientPhone: formData.clientPhone ? (formData.clientPhoneCode + ' ' + formData.clientPhone) : ''
    }
    delete (submissionData as any).clientPhoneCode
    if (!submissionData.client || submissionData.client === '') {
      delete (submissionData as any).client
    }

    try {
      await api.post('/erp/projects', submissionData)
      toast.success('Project Launched!')
      setShowModal(false)
      fetchData()
      setFormData({ name: '', client: '', customClientName: '', deadline: '', status: 'Planning', progress: 0, description: '', technology: '', clientWebsite: '', clientPhoneCode: '+91', clientPhone: '', clientEmail: '' })
    } catch (err) { toast.error('Failed to create project') }
  }

  const handleEditClick = (proj: Project) => {
    setEditingProject(proj)
    
    // Parse combined phone
    const phoneStr = proj.clientPhone || ''
    let code = '+91'
    let num = phoneStr
    
    const codes = ['+91', '+1', '+44', '+971', '+61', '+65', '+49', '+977', '+880']
    for (const c of codes) {
      if (phoneStr.startsWith(c + ' ')) {
        code = c
        num = phoneStr.substring(c.length + 1)
        break
      }
    }
    
    setEditFormData({
      name: proj.name || '',
      client: (proj.client as any)?._id || proj.client || '',
      customClientName: proj.customClientName || '',
      deadline: proj.deadline ? proj.deadline.substring(0, 10) : '',
      status: proj.status || 'Planning',
      progress: proj.progress || 0,
      description: proj.description || '',
      technology: proj.technology || '',
      clientWebsite: proj.clientWebsite || '',
      editPhoneCode: code,
      clientPhone: num,
      clientEmail: proj.clientEmail || ''
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject) return

    const submissionData = { 
      ...editFormData,
      progress: editFormData.status === 'Completed' ? 100 : editFormData.progress,
      clientPhone: editFormData.clientPhone ? (editFormData.editPhoneCode + ' ' + editFormData.clientPhone) : ''
    }
    delete (submissionData as any).editPhoneCode
    
    if (!submissionData.client || submissionData.client === '') {
      delete (submissionData as any).client
      submissionData.client = null as any
    }

    try {
      await api.put(`/erp/projects/${editingProject._id}`, submissionData)
      toast.success('Project details updated!')
      setShowEditModal(false)
      fetchData()
    } catch (err) { 
      toast.error('Failed to update project') 
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await api.delete('/erp/projects/' + id)
        toast.success('Project deleted successfully!')
        fetchData()
      } catch (err) {
        toast.error('Failed to delete project')
      }
    }
  }

  const markProjectComplete = async (proj: Project) => {
    if (!window.confirm(`Mark "${proj.name}" as Completed? It will move to Completed Projects.`)) return
    try {
      await api.put(`/erp/projects/${proj._id}`, { status: 'Completed', progress: 100 })
      toast.success('Project moved to Completed')
      fetchData()
    } catch {
      toast.error('Failed to update project')
    }
  }

  const reopenProject = async (proj: Project) => {
    if (!window.confirm(`Move "${proj.name}" back to Active Projects?`)) return
    try {
      await api.put(`/erp/projects/${proj._id}`, {
        status: 'In Progress',
        progress: proj.progress >= 100 ? 90 : proj.progress,
      })
      toast.success('Project moved to Active')
      fetchData()
    } catch {
      toast.error('Failed to update project')
    }
  }

  const handleAddTask = async () => {
    if (!newTaskTitle || !selectedProject) return
    
    const selectedEmp = employees.find(emp => emp._id === newTaskAssignee)
    const assignedToName = selectedEmp ? selectedEmp.name : ''
    
    const updatedTasks = [
      ...selectedProject.tasks, 
      { 
        title: newTaskTitle, 
        isCompleted: false, 
        assignedTo: newTaskAssignee || undefined, 
        assignedToName: assignedToName || undefined,
        priority: newTaskPriority 
      }
    ]
    try {
      const res = await api.put(`/erp/projects/${selectedProject._id}`, { tasks: updatedTasks })
      setSelectedProject(res.data)
      setNewTaskTitle('')
      setNewTaskAssignee('')
      setNewTaskPriority('Medium')
      fetchData()
    } catch (err) { toast.error('Failed to add task') }
  }

  const toggleTask = async (taskIndex: number) => {
    if (!selectedProject) return
    const updatedTasks = [...selectedProject.tasks]
    updatedTasks[taskIndex].isCompleted = !updatedTasks[taskIndex].isCompleted
    
    // Auto-calculate progress
    const completedCount = updatedTasks.filter(t => t.isCompleted).length
    const newProgress = Math.round((completedCount / updatedTasks.length) * 100)

    try {
      const res = await api.put(`/erp/projects/${selectedProject._id}`, { 
        tasks: updatedTasks,
        progress: newProgress
      })
      setSelectedProject(res.data)
      fetchData()
    } catch (err) { toast.error('Update failed') }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success'
      case 'In Progress': return 'primary'
      case 'Testing': return 'warning'
      case 'On Hold': return 'danger'
      default: return 'secondary'
    }
  }

  return (
    <div className="p-4 projects-page-container">
      <style>{`
        @media (max-width: 576px) {
          .projects-page-container {
            padding: 10px !important;
          }
          .projects-page-container .row {
            margin-left: -5px !important;
            margin-right: -5px !important;
          }
          .projects-page-container [class*="col-"] {
            padding-left: 5px !important;
            padding-right: 5px !important;
          }
          .page-content {
            padding-left: 5px !important;
            padding-right: 5px !important;
          }
        }
      `}</style>
      <Row className="align-items-md-center g-3 mb-4">
        <Col md={6}>
          <h3 className="fw-bold text-dark text-uppercase tracking-wider mb-1">
            {isCompletedView ? 'Completed Projects' : 'Active Projects'}
          </h3>
          <p className="text-muted small mb-0">
            {isCompletedView
              ? 'Finished deliveries. Reopen any project to move it back to Active.'
              : 'Ongoing work. Mark a project Complete when delivery is done.'}
          </p>
        </Col>
        <Col md={6} className="d-flex gap-2 justify-content-md-end flex-wrap">
          <Button variant="outline-primary" className="rounded-pill px-3 fw-bold d-flex align-items-center gap-1.5" onClick={exportToCSV} title="Export projects data to CSV file">
            <IconifyIcon icon="bx:download" className="fs-16" /> Export CSV
          </Button>
          {!isCompletedView && (
            <Button variant="primary" className="rounded-pill shadow-lg px-4 fw-bold" onClick={() => setShowModal(true)}>
              <IconifyIcon icon="bx:plus" className="me-1" /> New Project
            </Button>
          )}
        </Col>
      </Row>

      <Row>
        {visibleProjects.length === 0 ? (
          <Col xs={12}>
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="text-center py-5 text-muted">
                <IconifyIcon icon={isCompletedView ? 'bx:check-circle' : 'bx:briefcase'} className="fs-48 mb-2 d-block mx-auto opacity-50" />
                <h5 className="fw-bold">{isCompletedView ? 'No completed projects yet' : 'No active projects'}</h5>
                <p className="mb-0 small">
                  {isCompletedView
                    ? 'When you mark an active project as Completed, it will appear here.'
                    : 'Create a new project or reopen one from Completed Projects.'}
                </p>
              </Card.Body>
            </Card>
          </Col>
        ) : (
          visibleProjects.map((proj) => (
          <Col md={6} xl={4} key={proj._id} className="mb-4">
            <Card className="border-0 shadow-sm h-100 rounded-4 overflow-hidden border-top border-4 border-primary">
              <Card.Body className="d-flex flex-column h-100">
                <div className="d-flex justify-content-between mb-3 align-items-center">
                  <div className="d-flex gap-1.5 flex-wrap">
                    <Badge bg={getStatusColor(proj.status)} className="rounded-pill px-3 py-1.5">{proj.status}</Badge>
                    {proj.technology && (
                      <Badge bg="secondary-subtle" className="text-secondary border border-secondary-subtle rounded-pill px-2.5 py-1.5 fw-bold" style={{ fontSize: '11px' }}>
                        <IconifyIcon icon="bx:code-alt" className="me-1 fs-12 align-middle" />
                        {proj.technology}
                      </Badge>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <Button variant="link" className="p-0 text-secondary hover-scale" onClick={() => handleEditClick(proj)} title="Edit Project">
                      <IconifyIcon icon="bx:edit" className="fs-22 text-secondary" />
                    </Button>
                    <Button variant="link" className="p-0 text-primary hover-scale" onClick={() => { setSelectedProject(proj); setShowTaskModal(true); }} title="Manage Tasks">
                      <IconifyIcon icon="bx:list-check" className="fs-22" />
                    </Button>
                    {proj.status !== 'Completed' ? (
                      <Button variant="link" className="p-0 text-success hover-scale" onClick={() => markProjectComplete(proj)} title="Mark Complete">
                        <IconifyIcon icon="bx:check-circle" className="fs-22 text-success" />
                      </Button>
                    ) : (
                      <Button variant="link" className="p-0 text-warning hover-scale" onClick={() => reopenProject(proj)} title="Move to Active">
                        <IconifyIcon icon="bx:undo" className="fs-22 text-warning" />
                      </Button>
                    )}
                    <Button variant="link" className="p-0 text-danger hover-scale" onClick={() => handleDeleteProject(proj._id)} title="Delete Project">
                      <IconifyIcon icon="bx:trash" className="fs-22 text-danger" />
                    </Button>
                  </div>
                </div>
                
                <h5 className="fw-bold mb-1 text-dark fs-16">{proj.name}</h5>
                <p className="text-muted small mb-1">Client: <span className="text-dark fw-bold">{proj.client?.companyName || proj.customClientName}</span></p>
                
                {/* CONTACT LINKS BAR */}
                {(proj.clientEmail || proj.clientPhone || proj.clientWebsite) ? (
                  <div className="d-flex gap-1.5 mb-2.5 flex-wrap">
                    {proj.clientWebsite && (
                      <a href={proj.clientWebsite.startsWith('http') ? proj.clientWebsite : 'https://' + proj.clientWebsite} target="_blank" rel="noreferrer" className="badge bg-light text-primary border border-light-subtle d-inline-flex align-items-center gap-1 py-1.5 px-2 hover-scale text-decoration-none" title="Visit Website" style={{ fontSize: '11px' }}>
                        <IconifyIcon icon="bx:globe" className="fs-12" />
                        Website
                      </a>
                    )}
                    {proj.clientPhone && (
                      <a href={'tel:' + proj.clientPhone} className="badge bg-light text-success border border-light-subtle d-inline-flex align-items-center gap-1 py-1.5 px-2 hover-scale text-decoration-none" title="Call Client" style={{ fontSize: '11px' }}>
                        <IconifyIcon icon="bx:phone" className="fs-12" />
                        Call
                      </a>
                    )}
                    {proj.clientEmail && (
                      <a href={'mailto:' + proj.clientEmail} className="badge bg-light text-warning border border-light-subtle d-inline-flex align-items-center gap-1 py-1.5 px-2 hover-scale text-decoration-none" title="Email Client" style={{ fontSize: '11px' }}>
                        <IconifyIcon icon="bx:envelope" className="fs-12" />
                        Email
                      </a>
                    )}
                  </div>
                ) : null}

                {/* GORGEOUS THEMED DELIVERABLES / DETAILS BLOCK */}
                <div 
                  className="p-3 mb-3 rounded-3 mt-1" 
                  style={{ 
                    background: 'rgba(var(--bs-primary-rgb), 0.05)', 
                    borderLeft: '4px solid var(--bs-primary)',
                    fontSize: '13px',
                    lineHeight: '1.5'
                  }}
                >
                  <strong className="d-block mb-1 text-primary small text-uppercase" style={{ letterSpacing: '0.5px' }}>Project Deliverables:</strong>
                  <span className="text-secondary">{proj.description || "No description details provided. Manage tasks to add specific steps."}</span>
                </div>

                <div className="mt-auto">
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="text-muted">Progress</span>
                    <span className="fw-bold text-primary">{proj.status === 'Completed' ? 100 : proj.progress}%</span>
                  </div>
                  <ProgressBar now={proj.status === 'Completed' ? 100 : proj.progress} variant="primary" style={{ height: '8px' }} className="rounded-pill mb-3" />
                  
                  <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                    <div className="small text-muted">
                      <IconifyIcon icon="bx:task" className="me-1" />
                      {proj.tasks?.length || 0} Tasks
                    </div>
                    
                    {/* AVATARS STACK */}
                    <div className="d-flex align-items-center">
                      {proj.tasks && proj.tasks.length > 0 && (
                        <div className="d-flex align-items-center">
                          {Array.from(new Set(proj.tasks.filter(t => t.assignedToName).map(t => t.assignedToName))).slice(0, 3).map((name, idx) => {
                            const initials = name!.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                            return (
                              <div 
                                key={idx}
                                className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold shadow-sm" 
                                title={'Team Member: ' + name}
                                style={{ 
                                  width: '26px', 
                                  height: '26px', 
                                  fontSize: '10px',
                                  background: 'linear-gradient(135deg, var(--bs-primary), #00d2ff)',
                                  marginLeft: idx > 0 ? '-10px' : '0px',
                                  zIndex: 5 - idx,
                                  border: '2px solid var(--bs-card-bg, #fff)'
                                }}
                              >
                                {initials}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="small text-muted">
                      <IconifyIcon icon="bx:time-five" className="me-1" />
                      {new Date(proj.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          ))
        )}
      </Row>

      {/* NEW PROJECT MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title className="fw-bold text-dark fs-16">Setup New Project</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">PROJECT NAME</Form.Label>
              <Form.Control required type="text" onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Hoftrix Website" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">CLIENT</Form.Label>
              <Form.Select onChange={(e) => setFormData({...formData, client: e.target.value, customClientName: ''})}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.companyName || c.name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">OR CUSTOM CLIENT NAME</Form.Label>
              <Form.Control type="text" placeholder="e.g. Arvind Sharma" onChange={(e) => setFormData({...formData, customClientName: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">TECHNOLOGY / PLATFORM (e.g. WordPress, Shopify)</Form.Label>
              <Form.Control type="text" placeholder="e.g. WordPress, Shopify, React" onChange={(e) => setFormData({...formData, technology: e.target.value})} />
            </Form.Group>
            
            {/* CLIENT CONTACT INFORMATION - VERTICALLY STACKED & SPACIOUS */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted" style={{ fontSize: '11px' }}>CLIENT WEBSITE</Form.Label>
              <Form.Control type="text" placeholder="e.g. www.hoftrix.com" onChange={(e) => setFormData({...formData, clientWebsite: e.target.value})} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted" style={{ fontSize: '11px' }}>CLIENT PHONE</Form.Label>
              <div className="input-group">
                <Form.Select 
                  style={{ maxWidth: '135px', fontSize: '13px' }}
                  value={formData.clientPhoneCode}
                  onChange={(e) => setFormData({...formData, clientPhoneCode: e.target.value})}
                >
                  <option value="+91">India (+91)</option>
                  <option value="+1">US (+1)</option>
                  <option value="+44">UK (+44)</option>
                  <option value="+971">UAE (+971)</option>
                  <option value="+61">Australia (+61)</option>
                  <option value="+65">Singapore (+65)</option>
                  <option value="+49">Germany (+49)</option>
                  <option value="+977">Nepal (+977)</option>
                  <option value="+880">Bangladesh (+880)</option>
                </Form.Select>
                <Form.Control 
                  type="text" 
                  placeholder="e.g. 97970 31229" 
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({...formData, clientPhone: e.target.value})} 
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted" style={{ fontSize: '11px' }}>CLIENT EMAIL</Form.Label>
              <Form.Control type="email" placeholder="e.g. hoftrix16@gmail.com" onChange={(e) => setFormData({...formData, clientEmail: e.target.value})} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">PROJECT DESCRIPTION / DETAILS</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                placeholder="Describe key features, details or what needs to be done in this project..." 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">DEADLINE</Form.Label>
                  <Form.Control type="date" required onChange={(e) => setFormData({...formData, deadline: e.target.value})} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">STATUS</Form.Label>
                  <Form.Select onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option>Planning</option>
                    <option>In Progress</option>
                    <option>Testing</option>
                    <option>Completed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="outline-secondary" className="fw-bold px-4 rounded-pill" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="fw-bold px-4 rounded-pill shadow-sm">Launch Project</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* EDIT PROJECT DETAILS MODAL */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton><Modal.Title className="fw-bold text-dark fs-16">Edit Project Details</Modal.Title></Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">PROJECT NAME</Form.Label>
              <Form.Control required type="text" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} placeholder="e.g. Hoftrix Website" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">CLIENT</Form.Label>
              <Form.Select value={editFormData.client} onChange={(e) => setEditFormData({...editFormData, client: e.target.value, customClientName: ''})}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.companyName || c.name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">OR CUSTOM CLIENT NAME</Form.Label>
              <Form.Control type="text" value={editFormData.customClientName} placeholder="e.g. Arvind Sharma" onChange={(e) => setEditFormData({...editFormData, customClientName: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">TECHNOLOGY / PLATFORM (e.g. WordPress, Shopify)</Form.Label>
              <Form.Control type="text" value={editFormData.technology} placeholder="e.g. WordPress, Shopify, React" onChange={(e) => setEditFormData({...editFormData, technology: e.target.value})} />
            </Form.Group>
            
            {/* CLIENT CONTACT INFORMATION - VERTICALLY STACKED & SPACIOUS */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted" style={{ fontSize: '11px' }}>CLIENT WEBSITE</Form.Label>
              <Form.Control type="text" value={editFormData.clientWebsite} placeholder="e.g. www.hoftrix.com" onChange={(e) => setEditFormData({...editFormData, clientWebsite: e.target.value})} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted" style={{ fontSize: '11px' }}>CLIENT PHONE</Form.Label>
              <div className="input-group">
                <Form.Select 
                  style={{ maxWidth: '135px', fontSize: '13px' }}
                  value={editFormData.editPhoneCode}
                  onChange={(e) => setEditFormData({...editFormData, editPhoneCode: e.target.value})}
                >
                  <option value="+91">India (+91)</option>
                  <option value="+1">US (+1)</option>
                  <option value="+44">UK (+44)</option>
                  <option value="+971">UAE (+971)</option>
                  <option value="+61">Australia (+61)</option>
                  <option value="+65">Singapore (+65)</option>
                  <option value="+49">Germany (+49)</option>
                  <option value="+977">Nepal (+977)</option>
                  <option value="+880">Bangladesh (+880)</option>
                </Form.Select>
                <Form.Control 
                  type="text" 
                  value={editFormData.clientPhone}
                  placeholder="e.g. 97970 31229" 
                  onChange={(e) => setEditFormData({...editFormData, clientPhone: e.target.value})} 
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted" style={{ fontSize: '11px' }}>CLIENT EMAIL</Form.Label>
              <Form.Control type="email" value={editFormData.clientEmail} placeholder="e.g. hoftrix16@gmail.com" onChange={(e) => setEditFormData({...editFormData, clientEmail: e.target.value})} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">PROJECT DESCRIPTION / DETAILS</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={editFormData.description}
                placeholder="Describe key features, details or what needs to be done in this project..." 
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} 
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">DEADLINE</Form.Label>
                  <Form.Control type="date" value={editFormData.deadline} required onChange={(e) => setEditFormData({...editFormData, deadline: e.target.value})} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">STATUS</Form.Label>
                  <Form.Select value={editFormData.status} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}>
                    <option>Planning</option>
                    <option>In Progress</option>
                    <option>Testing</option>
                    <option>Completed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="outline-secondary" className="fw-bold px-4 rounded-pill" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="fw-bold px-4 rounded-pill shadow-sm">Save Changes</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* TASK MANAGEMENT MODAL */}
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold text-dark fs-16">
            <IconifyIcon icon="bx:task" className="me-1.5 text-primary fs-18" />
            {selectedProject?.name} - ClickUp Task Board
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          
          {/* CLICKUP TASK COMPOSER FORM */}
          <div className="p-3 mb-4 rounded-3 border border-light-subtle bg-light-subtle">
            <h6 className="fw-bold mb-3 text-dark small text-uppercase" style={{ letterSpacing: '0.5px' }}>
              <IconifyIcon icon="bx:plus" className="me-1 text-primary fs-16" /> Create New ClickUp Task
            </h6>
            <Form onSubmit={(e) => { e.preventDefault(); handleAddTask(); }}>
              <Row className="g-3 align-items-end">
                <Col xs={12} md={5}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted" style={{ fontSize: '11px' }}>TASK DESCRIPTION</Form.Label>
                    <Form.Control 
                      placeholder="e.g. Design Login Page Figma" 
                      value={newTaskTitle} 
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col xs={6} md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted" style={{ fontSize: '11px' }}>ASSIGN TO STAFF</Form.Label>
                    <Form.Select value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)}>
                      <option value="">Select staff...</option>
                      {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} ({emp.designation})</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col xs={6} md={2}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted" style={{ fontSize: '11px' }}>PRIORITY</Form.Label>
                    <Form.Select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col xs={12} md={1} className="text-end">
                  <Button variant="primary" type="submit" className="w-100 fw-bold d-flex justify-content-center align-items-center gap-1" style={{ height: '38px' }} title="Create Task">
                    <IconifyIcon icon="bx:plus" className="fs-18" />
                    <span className="d-md-none">Add Task</span>
                  </Button>
                </Col>
              </Row>
            </Form>
          </div>

          <h6 className="fw-bold text-dark text-uppercase small mb-3 tracking-wider" style={{ letterSpacing: '0.5px' }}>Tasks List:</h6>
          <ListGroup variant="flush">
            {selectedProject?.tasks?.map((task, idx) => {
              const initials = task.assignedToName ? task.assignedToName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'
              
              const priorityColors = {
                High: { bg: 'danger-subtle', text: 'danger' },
                Medium: { bg: 'warning-subtle', text: 'warning' },
                Low: { bg: 'secondary-subtle', text: 'secondary' }
              }
              const prio = task.priority || 'Medium'
              const prioTheme = priorityColors[prio] || priorityColors.Medium

              return (
                <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center border-0 px-0 py-3 bg-transparent border-bottom border-light-subtle">
                  <div className="d-flex align-items-center flex-grow-1">
                    <Form.Check 
                      type="checkbox" 
                      checked={task.isCompleted} 
                      onChange={() => toggleTask(idx)}
                      className="me-3"
                    />
                    <div className="d-flex flex-column">
                      <span style={{ textDecoration: task.isCompleted ? 'line-through' : 'none', color: task.isCompleted ? 'var(--bs-secondary-color)' : 'var(--bs-body-color)' }} className="fw-medium">
                        {task.title}
                      </span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    {/* ASSIGNEE BUBBLE */}
                    {task.assignedToName ? (
                      <div className="d-flex align-items-center gap-1.5" title={'Assigned to ' + task.assignedToName}>
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold shadow-sm" 
                          style={{ 
                            width: '26px', 
                            height: '26px', 
                            fontSize: '9px',
                            background: 'linear-gradient(135deg, var(--bs-primary), #00d2ff)'
                          }}
                        >
                          {initials}
                        </div>
                        <span className="small text-muted fw-medium d-none d-md-inline" style={{ fontSize: '12px' }}>{task.assignedToName}</span>
                      </div>
                    ) : (
                      <span className="text-muted italic small" style={{ fontSize: '12px' }}>Unassigned</span>
                    )}

                    {/* PRIORITY BADGE */}
                    <span className={'badge bg-' + prioTheme.bg + ' text-' + prioTheme.text + ' px-2 py-1 fs-11 rounded-1.5 fw-bold text-uppercase'}>
                      {prio}
                    </span>

                    {/* STATUS BADGE */}
                    <Badge bg={task.isCompleted ? 'success' : 'light'} text={task.isCompleted ? 'white' : 'dark'} className="px-2.5 py-1">
                      {task.isCompleted ? 'Done' : 'Pending'}
                    </Badge>
                  </div>
                </ListGroup.Item>
              )
            })}
            {(!selectedProject?.tasks || selectedProject.tasks.length === 0) && <div className="text-center p-5 text-muted">No tasks added yet.</div>}
          </ListGroup>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default ProjectsPage
