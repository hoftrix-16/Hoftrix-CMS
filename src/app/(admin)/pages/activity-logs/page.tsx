'use client'
import { useEffect, useState } from 'react'
import { Card, Col, Row, Table, Badge, Button, Form, InputGroup } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

interface ActivityLog {
  _id: string;
  userId?: string;
  userName: string;
  action: string;
  details?: string;
  type: 'success' | 'info' | 'warning' | 'danger';
  createdAt: string;
}

const ActivityLogsPage = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await api.get('/erp/activity-logs')
      setLogs(response.data || [])
    } catch (error) {
      console.error('Error fetching activity logs:', error)
      toast.error('Failed to load activity logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const getBadgeBg = (type: string) => {
    switch (type) {
      case 'success': return 'success'
      case 'danger': return 'danger'
      case 'warning': return 'warning'
      case 'info':
      default:
        return 'info'
    }
  }

  const getLogIcon = (action: string) => {
    const act = action.toLowerCase()
    if (act.includes('invoice')) return 'bx:receipt'
    if (act.includes('employee')) return 'bx:user'
    if (act.includes('finance') || act.includes('money')) return 'bx:dollar-circle'
    if (act.includes('project')) return 'bx:briefcase'
    return 'bx:info-circle'
  }

  // Client side filtering
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = filterType === 'all' || log.type === filterType

    return matchesSearch && matchesType
  })

  return (
    <div className="p-4">
      <Row className="align-items-center mb-4">
        <Col>
          <h3 className="fw-bold text-dark text-uppercase m-0">Activity History</h3>
          <p className="text-muted small">Monitor real-time system actions and operation logs securely.</p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="soft-primary" 
            className="rounded-pill shadow-sm px-3 fw-bold" 
            onClick={fetchLogs}
            disabled={loading}
          >
            <IconifyIcon icon="bx:refresh" className={`me-1 ${loading ? 'spin-anim' : ''}`} /> Refresh Logs
          </Button>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-3">
          <Row className="g-3">
            <Col md={6} lg={8}>
              <InputGroup className="bg-light rounded-pill border-0 px-2">
                <InputGroup.Text className="bg-transparent border-0 text-muted">
                  <IconifyIcon icon="bx:search" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search logs by action, details, or user..."
                  className="bg-transparent border-0 shadow-none ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6} lg={4}>
              <Form.Select 
                className="rounded-pill border-light bg-light"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="success">Success / Green</option>
                <option value="info">Info / Blue</option>
                <option value="warning">Warning / Orange</option>
                <option value="danger">Danger / Red</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="p-5 text-center">
          <h5 className="text-muted animate__animated animate__pulse animate__infinite">
            Fetching secure logs...
          </h5>
        </div>
      ) : (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3 border-0 text-muted small text-uppercase" style={{ width: '8%' }}>Log Icon</th>
                  <th className="py-3 border-0 text-muted small text-uppercase" style={{ width: '15%' }}>Action</th>
                  <th className="py-3 border-0 text-muted small text-uppercase" style={{ width: '15%' }}>User</th>
                  <th className="py-3 border-0 text-muted small text-uppercase" style={{ width: '42%' }}>Details</th>
                  <th className="py-3 border-0 text-muted small text-uppercase" style={{ width: '20%' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log._id}>
                      <td className="px-4 py-3">
                        <div className={`avatar avatar-md rounded bg-soft-${getBadgeBg(log.type)} text-${getBadgeBg(log.type)} d-flex align-items-center justify-content-center`} style={{ width: '38px', height: '38px' }}>
                          <IconifyIcon icon={getLogIcon(log.action)} className="fs-20" />
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge bg={getBadgeBg(log.type)} className="rounded-pill px-2.5 py-1 text-uppercase fs-10 tracking-wider">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3 fw-bold text-dark">{log.userName}</td>
                      <td className="py-3 text-muted">{log.details}</td>
                      <td className="py-3 text-muted small">
                        <IconifyIcon icon="bx:time-five" className="me-1" />
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      No logs found. Try performing actions (like invoices, finance entries, employee details) to populate them automatically!
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <style>{`
        .bg-soft-success { background-color: rgba(25, 135, 84, 0.1) !important; }
        .bg-soft-danger { background-color: rgba(220, 53, 69, 0.1) !important; }
        .bg-soft-warning { background-color: rgba(255, 193, 7, 0.1) !important; }
        .bg-soft-info { background-color: rgba(13, 202, 240, 0.1) !important; }
        .fs-20 { font-size: 20px; }
        .fs-10 { font-size: 10px; }
        .spin-anim { animation: spin 1s linear infinite; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ActivityLogsPage
