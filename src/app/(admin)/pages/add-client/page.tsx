'use client'
import { useState } from 'react'
import { Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

const AddClientPage = () => {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    industry: 'General',
    status: 'Active',
    servicesPurchased: '',
    assignedToName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
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
      const res = await api.post('/erp/clients', payload)
      toast.success('Client created')
      navigate(`/pages/clients/${res.data._id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create client')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="crm-page">
      <div className="mb-3">
        <Link to="/pages/clients" className="text-muted text-decoration-none small fw-semibold">
          <IconifyIcon icon="bx:arrow-back" className="me-1" /> Back to Clients
        </Link>
      </div>

      <Row className="align-items-end mb-4 g-3">
        <Col>
          <p className="text-muted text-uppercase small fw-bold mb-1">CRM</p>
          <h3 className="fw-bold mb-1">Add Client</h3>
          <p className="text-muted mb-0">Create a company account in the Hoftrix CRM.</p>
        </Col>
      </Row>

      <Card className="border-0" style={{ maxWidth: 720 }}>
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
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
                <Form.Control value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
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
                <Form.Control
                  value={form.servicesPurchased}
                  onChange={(e) => setForm({ ...form, servicesPurchased: e.target.value })}
                  placeholder="Website, SEO, Maintenance (comma separated)"
                />
              </Col>
            </Row>

            <div className="d-flex gap-2 mt-4">
              <Button variant="soft-secondary" as={Link as any} to="/pages/clients">Cancel</Button>
              <Button variant="primary" type="submit" disabled={saving} className="rounded-pill px-4">
                {saving ? <><Spinner animation="border" size="sm" className="me-2" />Saving...</> : 'Create Client'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}

export default AddClientPage
