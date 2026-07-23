import { useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import api from '@/helpers/api'
import { toast } from 'react-toastify'

type LeaveRequestCardProps = {
  onSubmitted?: () => void
}

const LeaveRequestCard = ({ onSubmitted }: LeaveRequestCardProps) => {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    type: 'Casual',
    startDate: '',
    endDate: '',
    reason: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/erp/employees/me/leaves', form)
      toast.success('Leave request submitted for approval')
      setShowModal(false)
      setForm({ type: 'Casual', startDate: '', endDate: '', reason: '' })
      onSubmitted?.()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="border rounded-4 p-3 bg-light-subtle">
        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
          <div>
            <h6 className="fw-bold mb-1">
              <IconifyIcon icon="iconamoon:calendar-duotone" className="me-1 text-primary" />
              Request Leave
            </h6>
            <p className="text-muted small mb-0">Submit sick, casual, or earned leave — admin will approve from Team Directory.</p>
          </div>
          <Button variant="primary" size="sm" className="rounded-pill px-3" onClick={() => setShowModal(true)}>
            Apply Leave
          </Button>
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Request Leave</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Leave Type</Form.Label>
              <Form.Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="Sick">Sick Leave</option>
                <option value="Casual">Casual Leave</option>
                <option value="Earned">Earned Leave</option>
                <option value="Unpaid">Unpaid Leave</option>
              </Form.Select>
            </Form.Group>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <Form.Label className="small fw-bold text-muted">Start Date</Form.Label>
                <Form.Control type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="col-md-6">
                <Form.Label className="small fw-bold text-muted">End Date</Form.Label>
                <Form.Control type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted">Reason</Form.Label>
              <Form.Control as="textarea" rows={3} required placeholder="Brief reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" className="rounded-pill" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="rounded-pill" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  )
}

export default LeaveRequestCard
