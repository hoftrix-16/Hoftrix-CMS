'use client'
import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

interface FollowUpRow {
  _id: string
  clientId: string
  companyName?: string
  title: string
  dueDate?: string
  status?: string
  note?: string
}

const FollowUpsPage = () => {
  const [rows, setRows] = useState<FollowUpRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Done'>('Pending')

  const fetchRows = async () => {
    setLoading(true)
    try {
      const res = await api.get('/erp/follow-ups')
      setRows(res.data || [])
    } catch {
      toast.error('Failed to load follow-ups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRows()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'All') return rows
    if (filter === 'Done') return rows.filter((r) => r.status === 'Done')
    return rows.filter((r) => r.status !== 'Done')
  }, [rows, filter])

  const markDone = async (row: FollowUpRow) => {
    try {
      await api.put(`/erp/clients/${row.clientId}/follow-ups/${row._id}`, { status: 'Done' })
      toast.success('Marked as done')
      fetchRows()
    } catch {
      toast.error('Failed to update follow-up')
    }
  }

  return (
    <div className="crm-page">
      <Row className="align-items-end mb-4 g-3">
        <Col>
          <p className="text-muted text-uppercase small fw-bold mb-1">CRM</p>
          <h3 className="fw-bold mb-1">Follow Ups</h3>
          <p className="text-muted mb-0">Track pending client actions and mark them complete.</p>
        </Col>
        <Col xs="auto">
          <Button variant="soft-secondary" onClick={fetchRows} disabled={loading}>
            <IconifyIcon icon="bx:refresh" className="me-1" /> Refresh
          </Button>
        </Col>
      </Row>

      <Card className="border-0 mb-3">
        <Card.Body className="py-3">
          <Form.Select style={{ maxWidth: 220 }} value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="Pending">Pending</option>
            <option value="Done">Done</option>
            <option value="All">All</option>
          </Form.Select>
        </Card.Body>
      </Card>

      <Card className="border-0 overflow-hidden">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="crm-empty">
              <div className="crm-empty-icon"><IconifyIcon icon="iconamoon:clock-duotone" /></div>
              <h5 className="fw-bold">No follow-ups</h5>
              <p className="mb-0">Nothing matches this filter right now.</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead>
                <tr>
                  <th className="ps-4">Company</th>
                  <th>Title</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Note</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row._id}>
                    <td className="ps-4 py-3">
                      <Link to={`/pages/clients/${row.clientId}`} className="fw-bold text-decoration-none">
                        {row.companyName || 'Client'}
                      </Link>
                    </td>
                    <td className="fw-medium">{row.title}</td>
                    <td className="text-muted small">{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '—'}</td>
                    <td>
                      <Badge bg={row.status === 'Done' ? 'success' : 'warning'} className="rounded-pill px-3">
                        {row.status || 'Pending'}
                      </Badge>
                    </td>
                    <td className="text-muted small" style={{ maxWidth: 220 }}>{row.note || '—'}</td>
                    <td className="text-end pe-4">
                      {row.status !== 'Done' && (
                        <Button size="sm" variant="soft-success" className="me-1" onClick={() => markDone(row)}>
                          Done
                        </Button>
                      )}
                      <Button as={Link as any} to={`/pages/clients/${row.clientId}`} size="sm" variant="soft-primary">
                        <IconifyIcon icon="bx:show" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}

export default FollowUpsPage
