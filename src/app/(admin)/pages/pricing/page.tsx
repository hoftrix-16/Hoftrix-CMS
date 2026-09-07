'use client'
import { useEffect, useState } from 'react'
import { Card, Col, Row, Button, Modal, Form, Badge } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

interface Service {
  _id: string;
  title: string;
  description: string;
  basePrice: number;
  currency: 'USD' | 'INR';
  category: string;
}

const emptyForm = { title: '', description: '', basePrice: '', category: 'Web Development', currency: 'USD' }

const ServiceCatalogPage = () => {
  const [services, setServices] = useState<Service[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyForm)

  const fetchServices = async () => {
    try {
      const response = await api.get('/erp/services')
      setServices(response.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchServices() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingService) {
        await api.put(`/erp/services/${editingService}`, formData)
        toast.success('Service updated successfully!')
      } else {
        await api.post('/erp/services', formData)
        toast.success('Service added successfully!')
      }
      setShowModal(false)
      setEditingService(null)
      fetchServices()
      setFormData(emptyForm)
    } catch (err) { toast.error(editingService ? 'Failed to update service' : 'Failed to add service') }
  }

  const handleEdit = (svc: Service) => {
    setEditingService(svc._id)
    setFormData({
      title: svc.title,
      description: svc.description || '',
      basePrice: String(svc.basePrice),
      category: svc.category,
      currency: svc.currency,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return
    try {
      await api.delete(`/erp/services/${id}`)
      toast.success('Service deleted successfully!')
      fetchServices()
    } catch (err) { toast.error('Failed to delete service') }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingService(null)
    setFormData(emptyForm)
  }

  const getCurrencySymbol = (currency: string) => currency === 'INR' ? '₹' : '$'

  return (
    <div className="p-4">
      <Row className="align-items-center mb-4">
        <Col>
          <h3 className="fw-bold text-dark text-uppercase tracking-wider">Hoftrix Service Catalog</h3>
          <p className="text-muted small">Manage your offerings in both USD and INR for global & local clients.</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" className="rounded-pill shadow px-4" onClick={() => { setFormData(emptyForm); setEditingService(null); setShowModal(true) }}>
            <IconifyIcon icon="bx:plus" className="me-1" /> Add New Service
          </Button>
        </Col>
      </Row>

      <Row>
        {services.length > 0 ? (
          services.map((svc) => (
            <Col md={6} xl={4} key={svc._id} className="mb-4">
              <Card className="border-0 shadow-sm h-100 rounded-4 overflow-hidden border-top border-4 border-info">
                <Card.Body className="p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Badge bg="soft-info" className="text-info rounded-pill px-3">{svc.category}</Badge>
                    <div>
                      <Button variant="soft-warning" size="sm" className="me-1" onClick={() => handleEdit(svc)} title="Edit"><IconifyIcon icon="bx:edit" /></Button>
                      <Button variant="soft-danger" size="sm" onClick={() => handleDelete(svc._id)} title="Delete"><IconifyIcon icon="bx:trash" /></Button>
                    </div>
                  </div>
                  <h5 className="fw-bold text-dark mb-2">{svc.title}</h5>
                  <p className="text-muted small mb-4" style={{ minHeight: '40px' }}>{svc.description}</p>
                  <div className="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
                    <span className="text-muted small">Starting from</span>
                    <h4 className="fw-bold text-primary mb-0">{getCurrencySymbol(svc.currency)}{svc.basePrice}</h4>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col xs={12} className="text-center p-5">
             <IconifyIcon icon="bx:list-plus" className="fs-60 text-muted mb-3" />
             <h4 className="text-muted">Your Catalog is Empty</h4>
             <Button variant="outline-primary" onClick={() => { setFormData(emptyForm); setEditingService(null); setShowModal(true) }}>Create First Service</Button>
          </Col>
        )}
      </Row>

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{editingService ? 'Edit Service' : 'Add New Service'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-uppercase">Service Title</Form.Label>
              <Form.Control type="text" placeholder="e.g. Website Design" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            </Form.Group>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-uppercase">Price</Form.Label>
                  <Form.Control type="number" placeholder="1500" required value={formData.basePrice} onChange={(e) => setFormData({...formData, basePrice: e.target.value})} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-uppercase">Currency</Form.Label>
                  <Form.Select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})}>
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-uppercase">Category</Form.Label>
              <Form.Select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                <option>Web Development</option>
                <option>App Development</option>
                <option>SEO</option>
                <option>UI/UX Design</option>
                <option>Maintenance</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-0">
              <Form.Label className="small fw-bold text-uppercase">Description</Form.Label>
              <Form.Control as="textarea" rows={3} placeholder="Briefly describe what's included..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="primary" type="submit" className="px-4 shadow">{editingService ? 'Save Changes' : 'Add Service'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}

export default ServiceCatalogPage
