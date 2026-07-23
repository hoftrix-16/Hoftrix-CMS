'use client'
import { useEffect, useState } from 'react'
import { Card, Col, Row, Table, Badge, Button, Modal, Form } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

interface FinanceRecord {
  _id: string;
  type: 'Income' | 'Expense';
  amount: number;
  category: string;
  reference: string;
  date: string;
}

const BalanceSheetPage = () => {
  const [data, setData] = useState({ totalIncome: 0, totalExpense: 0, profit: 0, records: { income: [] as FinanceRecord[], expenses: [] as FinanceRecord[] } })
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    type: 'Income' as 'Income' | 'Expense',
    amount: '',
    category: '',
    reference: '',
    date: new Date().toISOString().split('T')[0]
  })

  const fetchData = async () => {
    try {
      const res = await api.get('/erp/finance/balance-sheet')
      setData(res.data)
    } catch (err) { console.error(err) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/erp/finance', {
        ...formData,
        amount: Number(formData.amount)
      })
      toast.success('✅ Transaction added successfully!')
      setShowModal(false)
      setFormData({
        type: 'Income',
        amount: '',
        category: '',
        reference: '',
        date: new Date().toISOString().split('T')[0]
      })
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('❌ Failed to add transaction')
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return
    try {
      await api.delete(`/erp/finance/${id}`)
      toast.success('Transaction deleted successfully!')
      fetchData()
    } catch (err) {
      toast.error('Failed to delete transaction')
    }
  }

  const allRecords = [...data.records.income, ...data.records.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="p-4">
      <Row className="align-items-center mb-4">
        <Col>
          <h3 className="fw-bold text-dark text-uppercase">Balance Sheet</h3>
          <p className="text-muted small">Real-time tracking of company income, expenses, and net profit.</p>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
           <Button variant="primary" className="rounded-pill shadow px-3 fw-bold" onClick={() => setShowModal(true)}>
              <IconifyIcon icon="bx:plus" className="me-1" /> Add Transaction
           </Button>
           <Button variant="soft-primary" className="rounded-pill" onClick={fetchData}>
              <IconifyIcon icon="bx:refresh" className="me-1" /> Refresh Data
           </Button>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-4 bg-primary text-white overflow-hidden">
            <Card.Body className="p-4 position-relative">
              <div className="position-absolute top-0 end-0 p-3 opacity-25">
                <IconifyIcon icon="bx:trending-up" style={{ fontSize: '60px' }} />
              </div>
              <p className="text-white text-opacity-75 small fw-bold mb-1">TOTAL INCOME</p>
              <h2 className="fw-bold mb-0">₹{data.totalIncome.toLocaleString()}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-4 bg-danger text-white overflow-hidden">
            <Card.Body className="p-4 position-relative">
              <div className="position-absolute top-0 end-0 p-3 opacity-25">
                <IconifyIcon icon="bx:trending-down" style={{ fontSize: '60px' }} />
              </div>
              <p className="text-white text-opacity-75 small fw-bold mb-1">TOTAL EXPENSE</p>
              <h2 className="fw-bold mb-0">₹{data.totalExpense.toLocaleString()}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-4 bg-success text-white overflow-hidden">
            <Card.Body className="p-4 position-relative">
              <div className="position-absolute top-0 end-0 p-3 opacity-25">
                <IconifyIcon icon="bx:wallet" style={{ fontSize: '60px' }} />
              </div>
              <p className="text-white text-opacity-75 small fw-bold mb-1">NET PROFIT</p>
              <h2 className="fw-bold mb-0">₹{data.profit.toLocaleString()}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Header className="bg-white border-0 py-3">
          <h5 className="fw-bold m-0">Transaction History</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light text-muted small text-uppercase">
              <tr>
                <th className="px-4 py-3 border-0">Date</th>
                <th className="py-3 border-0">Type</th>
                <th className="py-3 border-0">Category / Reference</th>
                <th className="py-3 border-0 text-end">Amount</th>
                <th className="py-3 border-0 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allRecords.map((rec) => (
                <tr key={rec._id}>
                  <td className="px-4 py-3 text-muted">{new Date(rec.date).toLocaleDateString()}</td>
                  <td className="py-3">
                    <Badge bg={rec.type === 'Income' ? 'success' : 'danger'} className="rounded-pill px-3">
                      {rec.type}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <div className="fw-bold text-dark">{rec.category}</div>
                    <div className="extra-small text-muted">{rec.reference}</div>
                  </td>
                  <td className={`py-3 text-end fw-bold ${rec.type === 'Income' ? 'text-success' : 'text-danger'}`}>
                    {rec.type === 'Income' ? '+' : '-'} ₹{rec.amount.toLocaleString()}
                  </td>
                  <td className="py-3 text-center">
                    <Button variant="soft-danger" size="sm" onClick={() => handleDelete(rec._id)} title="Delete">
                      <IconifyIcon icon="bx:trash" />
                    </Button>
                  </td>
                </tr>
              ))}
              {allRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">No transactions found yet.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Add New Transaction</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Transaction Type</Form.Label>
              <Form.Select 
                value={formData.type} 
                onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Income">Income (Earning / Credit)</option>
                <option value="Expense">Expense (Debit / Payment)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Amount (₹) *</Form.Label>
              <Form.Control 
                type="number" 
                required 
                placeholder="Enter amount"
                value={formData.amount} 
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Category *</Form.Label>
              <Form.Control 
                type="text" 
                required 
                placeholder="e.g. Office Rent, Client Project, Utility Bill"
                value={formData.category} 
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Reference / Description</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g. Invoice #203, Month of June"
                value={formData.reference} 
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Transaction Date</Form.Label>
              <Form.Control 
                type="date" 
                value={formData.date} 
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" className="rounded-pill px-4" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="rounded-pill px-4 shadow">
              Save Transaction
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}

export default BalanceSheetPage
