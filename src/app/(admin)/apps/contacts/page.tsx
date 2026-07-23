import { useState, useEffect } from 'react'
import { Card, CardBody, Col, Row, Button, Modal, Form, Badge, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import httpClient from '@/helpers/httpClient'
import { resolveAvatar, handleAvatarError } from '@/helpers/avatar'
import { toast } from 'react-toastify'

interface Client {
  _id: string
  name: string
  email: string
  phone: string
  website?: string
  technologies?: string
  projectName?: string
  avatar?: string
  role: string
}

const Contacts = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  
  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phoneCode: '+91',
    phone: '',
    website: '',
    technologies: '',
    projectName: ''
  })
  const [updating, setUpdating] = useState(false)

  // Fetch Clients from Database
  const fetchClients = async () => {
    setLoading(true)
    try {
      const res = await httpClient.get('/auth/clients')
      setClients(res.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load client directory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  // Delete Client Operation
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete client "${name}"? This action is permanent.`)) return
    try {
      await httpClient.delete(`/auth/users/${id}`)
      toast.success(`Client "${name}" deleted successfully!`)
      fetchClients()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete client account')
    }
  }

  // Trigger Edit Modal
  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client)

    // Parse combined phone
    const phoneStr = client.phone || ''
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
      name: client.name || '',
      email: client.email || '',
      phoneCode: code,
      phone: num,
      website: client.website || '',
      technologies: client.technologies || '',
      projectName: client.projectName || ''
    })
    setShowEditModal(true)
  }

  // Save Client Changes
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return
    setUpdating(true)
    
    const submissionData = {
      ...editFormData,
      phone: editFormData.phone ? `${editFormData.phoneCode} ${editFormData.phone}` : ''
    }
    delete (submissionData as any).phoneCode

    try {
      await httpClient.put(`/auth/users/${editingClient._id}`, submissionData)
      toast.success('Client updated successfully!')
      setShowEditModal(false)
      fetchClients()
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Failed to update client'
      toast.error(msg)
    } finally {
      setUpdating(false)
    }
  }

  // Export Data to CSV File
  const handleDownloadCSV = () => {
    if (clients.length === 0) {
      toast.error('No client records to download')
      return
    }

    // CSV Headers
    const headers = ['Name', 'Project Name', 'Email', 'Phone', 'Website', 'Technologies']
    
    // Format rows safely with quotes
    const rows = clients.map((client) => {
      const name = `"${(client.name || '').replace(/"/g, '""')}"`
      const projectName = `"${(client.projectName || '').replace(/"/g, '""')}"`
      const email = `"${(client.email || '').replace(/"/g, '""')}"`
      const phone = `"${(client.phone || '').replace(/"/g, '""')}"`
      const website = `"${(client.website || '').replace(/"/g, '""')}"`
      const technologies = `"${(client.technologies || '').replace(/"/g, '""')}"`
      return [name, projectName, email, phone, website, technologies].join(',')
    })

    // Combine headers and rows
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n')
    
    // Create Blob and Trigger direct download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `hoftrix_client_list_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('CSV spreadsheet exported successfully!')
  }

  return (
    <>
      <PageMetaData title="Client Directory" />

      {/* Header section with download button */}
      <Row className="align-items-center mb-4 p-3 bg-white bg-opacity-10 rounded-4 mx-0 shadow-sm border border-light border-opacity-10">
        <Col>
          <PageBreadcrumb subName="Management" title="Client List" />
          <p className="text-muted small mb-0 mt-1">Manage active business clients, website URLs, and technological stacks.</p>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button 
            variant="soft-success" 
            className="rounded-pill shadow-sm px-4 py-2 fw-bold d-flex align-items-center gap-1.5"
            onClick={handleDownloadCSV}
          >
            <IconifyIcon icon="bx:download" className="fs-18" />
            <span>Export CSV</span>
          </Button>
          <Link to="/pages/add-client" className="btn btn-primary rounded-pill shadow-sm px-4 py-2 fw-bold d-flex align-items-center gap-1.5">
            <IconifyIcon icon="bx:plus" className="fs-18" />
            <span>Add Client</span>
          </Link>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-2">Loading client directory...</p>
        </div>
      ) : clients.length > 0 ? (
        <Row className="row-cols-1 row-cols-md-2 row-cols-xl-3 row-cols-xxl-4 g-4 px-2">
          {clients.map((client) => {
            const avatarUrl = resolveAvatar(client.avatar, client.name)
            const techBadges = client.technologies 
              ? client.technologies.split(',').map(t => t.trim()).filter(Boolean) 
              : []

            return (
              <Col key={client._id}>
                <Card className="border-0 shadow-sm rounded-4 overflow-hidden h-100 hover-card transition-all">
                  <CardBody className="p-4 d-flex flex-column h-100 position-relative">
                    {/* Top Action Buttons (Edit/Delete floating header) */}
                    <div className="position-absolute end-0 top-0 mt-3 me-3 d-flex gap-1">
                      <Button 
                        variant="soft-warning" 
                        size="sm" 
                        className="rounded-circle p-1 d-flex align-items-center justify-content-center" 
                        style={{ width: '28px', height: '28px' }}
                        title="Edit Client"
                        onClick={() => handleOpenEditModal(client)}
                      >
                        <IconifyIcon icon="bx:edit-alt" className="fs-14" />
                      </Button>
                      <Button 
                        variant="soft-danger" 
                        size="sm" 
                        className="rounded-circle p-1 d-flex align-items-center justify-content-center" 
                        style={{ width: '28px', height: '28px' }}
                        title="Delete Client"
                        onClick={() => handleDelete(client._id, client.name)}
                      >
                        <IconifyIcon icon="bx:trash" className="fs-14" />
                      </Button>
                    </div>

                    <div className="text-center mb-3">
                      <img 
                        src={avatarUrl} 
                        alt={client.name}
                        onError={handleAvatarError}
                        className="img-fluid rounded-circle border border-2 border-primary border-opacity-10 p-1 mb-2 shadow-sm"
                        style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                      />
                      <h5 className="fw-bold text-dark mb-1 text-truncate px-3" title={client.name}>{client.name}</h5>
                      <span className="badge bg-soft-primary text-primary rounded-pill small px-2.5 py-1 text-uppercase fs-10 mb-2 d-inline-block">
                        {client.role}
                      </span>
                      {client.projectName && (
                        <div className="text-secondary small fw-bold text-truncate px-3" title={client.projectName}>
                          Project: {client.projectName}
                        </div>
                      )}
                    </div>

                    {/* Client Parameters Grid */}
                    <div className="bg-light bg-opacity-50 rounded-3 p-3 mb-3 flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom border-light">
                        <IconifyIcon icon="bx:mail-send" className="text-primary fs-16" />
                        <span className="small text-dark text-truncate" title={client.email}>{client.email}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom border-light">
                        <IconifyIcon icon="bx:phone-call" className="text-success fs-16" />
                        <span className="small text-muted">{client.phone || 'No phone recorded'}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <IconifyIcon icon="bx:globe" className="text-info fs-16" />
                        {client.website ? (
                          <a 
                            href={client.website.startsWith('http') ? client.website : `https://${client.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="small text-primary text-decoration-none text-truncate fw-bold"
                          >
                            {client.website.replace(/^https?:\/\/(www\.)?/, '')}
                          </a>
                        ) : (
                          <span className="small text-muted italic">No website link</span>
                        )}
                      </div>
                    </div>

                    {/* Technologies/Designation section */}
                    <div className="mt-auto">
                      <p className="text-muted small fw-bold text-uppercase mb-2" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>
                        Tech stack used:
                      </p>
                      {techBadges.length > 0 ? (
                        <div className="d-flex flex-wrap gap-1">
                          {techBadges.map((tech, i) => (
                            <Badge key={i} bg="soft-secondary" className="text-secondary rounded-pill fw-medium fs-10 px-2 py-1">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted small italic">No technologies logged</span>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </Col>
            )
          })}
        </Row>
      ) : (
        <div className="text-center py-5 my-5 text-muted">
          <IconifyIcon icon="iconamoon:profile-circle-duotone" width={80} height={80} className="opacity-25 mb-3" />
          <h4 className="fw-bold">Client Directory is Empty</h4>
          <p className="small mb-3">No client user profiles exist in the database.</p>
          <Link to="/pages/add-client" className="btn btn-primary rounded-pill px-4 py-2 fw-bold">
            Register First Client
          </Link>
        </div>
      )}

      {/* Edit Client Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-dark fs-18">Update Client Account</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveChanges}>
          <Modal.Body className="py-3 px-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-dark">Client Name</Form.Label>
              <Form.Control
                type="text"
                required
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="rounded-3"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-dark">Email Address</Form.Label>
              <Form.Control
                type="email"
                required
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="rounded-3"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-dark">Project Name</Form.Label>
              <Form.Control
                type="text"
                value={editFormData.projectName}
                onChange={(e) => setEditFormData({ ...editFormData, projectName: e.target.value })}
                className="rounded-3"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-dark">Phone Number</Form.Label>
              <div className="input-group">
                <Form.Select 
                  style={{ maxWidth: '120px' }}
                  value={editFormData.phoneCode}
                  onChange={(e) => setEditFormData({...editFormData, phoneCode: e.target.value})}
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
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="rounded-end-3"
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-dark">Client Website</Form.Label>
              <Form.Control
                type="text"
                value={editFormData.website}
                onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                placeholder="https://example.com"
                className="rounded-3"
              />
            </Form.Group>

            <Form.Group className="mb-1">
              <Form.Label className="small fw-bold text-dark">Technologies</Form.Label>
              <Form.Control
                type="text"
                value={editFormData.technologies}
                onChange={(e) => setEditFormData({ ...editFormData, technologies: e.target.value })}
                placeholder="React, Node, MERN (comma-separated)"
                className="rounded-3"
              />
              <Form.Text className="text-muted" style={{ fontSize: '10px' }}>
                Separate different technologies with commas to display them as individual badges.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0 px-4 pb-4">
            <Button variant="light" className="rounded-pill px-4 py-2" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="rounded-pill px-4 py-2 fw-bold" disabled={updating}>
              {updating ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style>{`
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08) !important;
        }
        .transition-all {
          transition: all 0.25s ease-in-out;
        }
        .gap-1.5 {
          gap: 6px;
        }
      `}</style>
    </>
  )
}

export default Contacts
