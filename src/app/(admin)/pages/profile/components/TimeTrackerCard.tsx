'use client'
import { useEffect, useState } from 'react'
import { Card, Col, Row, Button, Form, Alert, Table, Badge } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'
import { useAuthContext } from '@/context/useAuthContext'

interface Employee {
  _id: string;
  name: string;
  email: string;
  designation: string;
  attendance: {
    date: string;
    clockIn: string;
    clockOut?: string;
    duration?: number;
    status: string;
  }[];
  timeLogs: {
    projectName: string;
    taskDescription: string;
    duration: number;
    date: string;
  }[];
}

const TimeTrackerCard = () => {
  const { user } = useAuthContext()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<any[]>([])
  
  // Form state
  const [taskData, setTaskData] = useState({
    projectName: 'General Task',
    taskDescription: '',
    duration: 1
  })

  // Timer state
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [todayAtt, setTodayAtt] = useState<any | null>(null)
  const [timeWorkedStr, setTimeWorkedStr] = useState('0h 0m 0s')

  const fetchEmployeeData = async () => {
    if (!user?.email) return
    setLoading(true)
    try {
      // 1. Fetch employee matching user email
      const empRes = await api.get(`/erp/employees/email/${user.email}`)
      setEmployee(empRes.data)
      
      // 2. Fetch projects for selector
      const projRes = await api.get('/erp/projects')
      setProjects(projRes.data || [])

      // 3. Evaluate today's attendance state
      const attList = empRes.data.attendance || []
      const todayStr = new Date().toISOString().split('T')[0]
      const activeAtt = attList.find((att: any) => att.date === todayStr && !att.clockOut)
      
      if (activeAtt) {
        setIsClockedIn(true)
        setTodayAtt(activeAtt)
      } else {
        setIsClockedIn(false)
        setTodayAtt(null)
      }
    } catch (error: any) {
      console.log('No employee profile matching email:', user.email)
      setEmployee(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployeeData()
  }, [user])

  // Real-time ticking stopwatch when clocked in
  useEffect(() => {
    let interval: any
    if (isClockedIn && todayAtt?.clockIn) {
      interval = setInterval(() => {
        const start = new Date(todayAtt.clockIn).getTime()
        const now = new Date().getTime()
        const diffMs = now - start
        
        const hrs = Math.floor(diffMs / 3600000)
        const mins = Math.floor((diffMs % 3600000) / 60000)
        const secs = Math.floor((diffMs % 60000) / 1000)
        
        setTimeWorkedStr(`${hrs}h ${mins}m ${secs}s`)
      }, 1000)
    } else {
      setTimeWorkedStr('0h 0m 0s')
    }
    return () => clearInterval(interval)
  }, [isClockedIn, todayAtt])

  const handleClockIn = async () => {
    if (!employee) return
    try {
      await api.post(`/erp/employees/${employee._id}/clock-in`)
      toast.success('Successfully clocked in!')
      fetchEmployeeData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Clock-in failed')
    }
  }

  const handleClockOut = async () => {
    if (!employee) return
    try {
      await api.post(`/erp/employees/${employee._id}/clock-out`)
      toast.info('Successfully clocked out!')
      fetchEmployeeData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Clock-out failed')
    }
  }

  const handleAddTaskLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employee) return
    try {
      await api.post(`/erp/employees/${employee._id}/time-logs`, taskData)
      toast.success('Task logged successfully!')
      setTaskData({ ...taskData, taskDescription: '', duration: 1 })
      fetchEmployeeData()
    } catch (error) {
      toast.error('Failed to log task hours')
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-sm rounded-4 p-4 text-center">
        <h6 className="text-muted animate__animated animate__pulse animate__infinite">
          Syncing secure workspace attendance profile...
        </h6>
      </Card>
    )
  }

  if (!employee) {
    return (
      <Alert variant="warning" className="rounded-4 border-0 shadow-sm p-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <IconifyIcon icon="bx:error-circle" className="fs-24 text-warning" />
          <h5 className="fw-bold m-0 text-dark">Time Tracker Not Linked</h5>
        </div>
        <p className="mb-0 text-muted small">
          Please register an employee entry in the **Employee List** with email: <strong className="text-dark">{user?.email}</strong> to activate live time tracking, attendance stopwatch, and project task log sheets.
        </p>
      </Alert>
    )
  }

  return (
    <Row className="g-4">
      {/* Attendance Clock Card */}
      <Col lg={5}>
        <Card className="border-0 shadow-sm rounded-4 h-100 bg-white overflow-hidden">
          <Card.Body className="p-4 d-flex flex-column justify-content-between text-center">
            <div>
              <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                <IconifyIcon icon="bx:time-five" className="fs-22 text-primary" />
                <span className="fw-bold text-uppercase text-muted fs-11 tracking-wider">Attendance Stopwatch</span>
              </div>
              <h3 className="fw-medium text-secondary mb-1">
                {new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}
              </h3>
              <p className="text-muted small">Work hours logged automatically in MongoDB</p>
            </div>

            <div className="my-4 py-3 bg-light rounded-4">
              <span className="d-block text-muted small text-uppercase fw-semibold tracking-wider mb-1">Time Elapsed Today</span>
              <h1 className="fw-bold font-monospace text-primary tracking-wide m-0" style={{ fontSize: '2.5rem' }}>
                {timeWorkedStr}
              </h1>
            </div>

            <div className="d-grid">
              {!isClockedIn ? (
                <Button 
                  variant="success" 
                  className="rounded-pill py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 pulse-green"
                  onClick={handleClockIn}
                >
                  <IconifyIcon icon="bx:fingerprint" className="fs-20 animate-pulse" /> Clock-In Attendance
                </Button>
              ) : (
                <Button 
                  variant="danger" 
                  className="rounded-pill py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 pulse-red"
                  onClick={handleClockOut}
                >
                  <IconifyIcon icon="bx:log-out-circle" className="fs-20" /> Clock-Out Attendance
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/* Task Logger Card */}
      <Col lg={7}>
        <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
          <Card.Body className="p-4">
            <h6 className="fw-bold text-uppercase text-primary mb-3">Log Task Work Hours</h6>
            {!isClockedIn ? (
              <div className="text-center py-4 my-2 text-muted">
                <IconifyIcon icon="bx:lock-alt" className="fs-36 text-warning mb-2 animate__animated animate__shakeX animate__infinite animate__slower d-inline-block" />
                <h6 className="fw-bold text-dark">Logging Locked</h6>
                <p className="small mb-0 text-muted mx-auto" style={{ maxWidth: '280px' }}>
                  Please <strong>Clock-In Attendance</strong> first to unlock logging work hours for today.
                </p>
              </div>
            ) : (
              <Form onSubmit={handleAddTaskLog}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted">SELECT PROJECT</Form.Label>
                      <Form.Select 
                        value={taskData.projectName}
                        onChange={(e) => setTaskData({...taskData, projectName: e.target.value})}
                      >
                        <option value="General Task">General Task</option>
                        {projects.map((p: any) => (
                          <option key={p._id} value={p.name}>{p.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted">DURATION (HOURS)</Form.Label>
                      <Form.Control 
                        required
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={taskData.duration}
                        onChange={(e) => setTaskData({...taskData, duration: parseFloat(e.target.value) || 1})}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">TASK DESCRIPTION</Form.Label>
                  <Form.Control 
                    required
                    as="textarea"
                    rows={2}
                    placeholder="What deliverables, designs, or features were completed?"
                    value={taskData.taskDescription}
                    onChange={(e) => setTaskData({...taskData, taskDescription: e.target.value})}
                  />
                </Form.Group>

                <div className="text-end">
                  <Button variant="primary" type="submit" className="rounded-pill shadow-sm px-4 fw-bold">
                    <IconifyIcon icon="bx:save" className="me-1" /> Log Work Session
                  </Button>
                </div>
              </Form>
            )}
          </Card.Body>
        </Card>
      </Col>

      {/* History Lists */}
      <Col xs={12}>
        <Row className="g-4">
          <Col md={6}>
            <Card className="border-0 shadow-sm rounded-4 bg-white overflow-hidden h-100">
              <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                <h6 className="fw-bold text-uppercase text-secondary m-0">Recent Attendance Logs</h6>
                <Badge bg="soft-primary" className="text-primary rounded-pill px-2.5">Monthly Attendance</Badge>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0 align-middle mt-2">
                  <thead className="bg-light fs-11 text-uppercase text-muted">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="py-2.5">Clock In</th>
                      <th className="py-2.5">Clock Out</th>
                      <th className="py-2.5 text-end px-4">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="small">
                    {employee.attendance && employee.attendance.length > 0 ? (
                      [...employee.attendance].reverse().slice(0, 5).map((att, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2.5 fw-bold">{new Date(att.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                          <td className="py-2.5 text-success">{new Date(att.clockIn).toLocaleTimeString(undefined, { timeStyle: 'short' })}</td>
                          <td className="py-2.5 text-danger">
                            {att.clockOut ? new Date(att.clockOut).toLocaleTimeString(undefined, { timeStyle: 'short' }) : '--'}
                          </td>
                          <td className="py-2.5 text-end px-4 fw-bold">{att.duration ? `${att.duration} hrs` : '--'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="text-center py-4 text-muted">No attendance logs logged yet.</td></tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="border-0 shadow-sm rounded-4 bg-white overflow-hidden h-100">
              <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                <h6 className="fw-bold text-uppercase text-secondary m-0">Recent Project Task Hours</h6>
                <Badge bg="soft-success" className="text-success rounded-pill px-2.5">Task Sheets</Badge>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0 align-middle mt-2">
                  <thead className="bg-light fs-11 text-uppercase text-muted">
                    <tr>
                      <th className="px-4 py-2.5">Project</th>
                      <th className="py-2.5">Task Detail</th>
                      <th className="py-2.5 text-end px-4">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="small">
                    {employee.timeLogs && employee.timeLogs.length > 0 ? (
                      [...employee.timeLogs].reverse().slice(0, 5).map((log, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2.5 fw-bold text-primary">{log.projectName}</td>
                          <td className="py-2.5 text-muted">{log.taskDescription}</td>
                          <td className="py-2.5 text-end px-4 fw-bold text-dark">{log.duration} hrs</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="text-center py-4 text-muted">No task logs entered yet.</td></tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Col>

      <style>{`
        .pulse-green {
          box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.4);
          animation: pulseGreen 2s infinite;
        }
        @keyframes pulseGreen {
          0% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(25, 135, 84, 0); }
          100% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0); }
        }
        
        .pulse-red {
          box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4);
          animation: pulseRed 2s infinite;
        }
        @keyframes pulseRed {
          0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
        }
        
        .fs-24 { font-size: 24px; }
        .fs-22 { font-size: 22px; }
        .fs-20 { font-size: 20px; }
        .fs-11 { font-size: 11px; }
        .bg-soft-primary { background-color: rgba(13, 110, 253, 0.1) !important; }
        .bg-soft-success { background-color: rgba(25, 135, 84, 0.1) !important; }
      `}</style>
    </Row>
  )
}

export default TimeTrackerCard
