'use client'
import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

interface FinanceRecord {
  _id: string
  type: 'Income' | 'Expense'
  amount: number
  category: string
  reference?: string
  date: string
}

const ExpensesPage = () => {
  const [totalExpense, setTotalExpense] = useState(0)
  const [records, setRecords] = useState<FinanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    category: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/erp/finance/balance-sheet')
      const data = res.data || {}
      setTotalExpense(data.totalExpense || 0)
      setRecords(data.records?.expenses || [])
    } catch {
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const sorted = useMemo(
    () => [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [records]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/erp/finance', {
        type: 'Expense',
        amount: Number(form.amount),
        category: form.category,
        reference: form.reference,
        date: form.date,
      })
      toast.success('Expense recorded')
      setShowModal(false)
      setForm({ amount: '', category: '', reference: '', date: new Date().toISOString().split('T')[0] })
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add expense')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this expense record?')) return
    try {
      await api.delete(`/erp/finance/${id}`)
      toast.success('Deleted')
      fetchData()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="crm-page">
      <Row className="align-items-end mb-4 g-3">
        <Col>
          <p className="text-muted text-uppercase small fw-bold mb-1">Finance</p>
          <h3 className="fw-bold mb-1">Expenses</h3>
          <p className="text-muted mb-0">Track business costs and outgoing payments.</p>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button variant="primary" className="rounded-pill px-4" onClick={() => setShowModal(true)}>
            <IconifyIcon icon="bx:plus" className="me-1" /> Add Expense
          </Button>
          <Button variant="soft-secondary" onClick={fetchData} disabled={loading}>
            <IconifyIcon icon="bx:refresh" className="me-1" /> Refresh
          </Button>
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col md={6}>
          <div className="crm-stat-card">
            <div className="crm-stat-label">Total Expenses</div>
            <p className="crm-stat-value">₹{totalExpense.toLocaleString()}</p>
          </div>
        </Col>
        <Col md={6}>
          <div className="crm-stat-card">
            <div className="crm-stat-label">Records</div>
            <p className="crm-stat-value">{records.length}</p>
          </div>
        </Col>
      </Row>

      <Card className="border-0 overflow-hidden">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : sorted.length === 0 ? (
            <div className="crm-empty">
              <div className="crm-empty-icon"><IconifyIcon icon="iconamoon:delivery-duotone" /></div>
              <h5 className="fw-bold">No expenses yet</h5>
              <p className="mb-0">Log your first business expense.</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead>
                <tr>
                  <th className="ps-4">Date</th>
                  <th>Category</th>
                  <th>Reference</th>
                  <th className="text-end">Amount</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((rec) => (
                  <tr key={rec._id}>
                    <td className="ps-4 py-3 text-muted small">{new Date(rec.date).toLocaleDateString()}</td>
                    <td className="fw-semibold">{rec.category}</td>
                    <td className="text-muted small">{rec.reference || '—'}</td>
                    <td className="text-end fw-bold text-danger">− ₹{rec.amount.toLocaleString()}</td>
                    <td className="text-end pe-4">
                      <Button size="sm" variant="soft-danger" onClick={() => handleDelete(rec._id)}>
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
        <Modal.Header closeButton><Modal.Title className="fw-bold">Add Expense</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Amount (₹) *</Form.Label>
              <Form.Control type="number" required min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category *</Form.Label>
              <Form.Control required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Rent, tools, ads..." />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reference</Form.Label>
              <Form.Control value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Date</Form.Label>
              <Form.Control type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Form.Group>
            <Badge bg="soft-danger" className="text-danger mt-3">Type: Expense</Badge>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="soft-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Expense'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}

export default ExpensesPage
