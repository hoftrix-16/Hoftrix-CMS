import { useEffect, useState } from 'react'
import { Card, Col, Row, Table, Button, Badge, Tab, Nav } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageHeader from '@/components/PageHeader'
import { COMPANY } from '@/config/app'
import { resolveAvatar, handleAvatarError } from '@/helpers/avatar'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/context/useAuthContext'

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  status: string;
  avatar: string;
  salary: number;
  joiningDate: string;
  role?: string;
  leaves?: any[];
}

const EmployeesPage = () => {
  const { user } = useAuthContext()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'members' | 'leaves'>('members')
  const navigate = useNavigate()

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const res = await api.get('/erp/employees')
      setEmployees(res.data || [])
    } catch (err: any) {
      console.error(err)
      const status = err?.response?.status
      if (status === 401) {
        toast.error('Session expired. Please sign in again.')
      } else if (status === 403) {
        toast.error('You do not have permission to view employees.')
      } else {
        toast.error(err?.response?.data?.message || 'Failed to load employee list')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchEmployees() 
  }, [])

  const deleteEmployee = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this employee?')) return
    try {
      await api.delete(`/erp/employees/${id}`)
      toast.success('Employee removed successfully')
      fetchEmployees()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed')
    }
  }

  const handleUpdateLeaveStatus = async (employeeId: string, leaveIndex: number, newStatus: 'Approved' | 'Rejected') => {
    try {
      const emp = employees.find(e => e._id === employeeId)
      if (!emp) return
      
      const updatedLeaves = [...(emp.leaves || [])]
      updatedLeaves[leaveIndex] = { ...updatedLeaves[leaveIndex], status: newStatus }
      
      await api.put(`/erp/employees/${employeeId}`, {
        ...emp,
        leaves: updatedLeaves
      })
      
      toast.success(`✅ Leave request successfully ${newStatus}!`)
      fetchEmployees()
    } catch (err) {
      console.error(err)
      toast.error('❌ Failed to update leave status')
    }
  }

  // Filter out the logged-in user from the directory and leaves if not an admin
  const displayedEmployees = user?.role === 'admin'
    ? employees
    : employees.filter(emp => emp.email?.toLowerCase() !== user?.email?.toLowerCase())

  // Aggregate leaves from all employees
  const allLeaves = displayedEmployees.reduce((acc: any[], emp) => {
    if (emp.leaves && Array.isArray(emp.leaves)) {
      emp.leaves.forEach((leave: any, index: number) => {
        acc.push({
          ...leave,
          employeeId: emp._id,
          employeeName: emp.name,
          employeeAvatar: emp.avatar,
          employeeDesignation: emp.designation,
          leaveIndex: index
        })
      })
    }
    return acc
  }, [])

  // Sort leaves: Pending first, then by startDate desc
  const sortedLeaves = allLeaves.sort((a, b) => {
    if (a.status === 'Pending' && b.status !== 'Pending') return -1
    if (a.status !== 'Pending' && b.status === 'Pending') return 1
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  })

  return (
    <div className="crm-page">
      <PageHeader
        title="Team Directory"
        subtitle={`Manage ${COMPANY.legalName} staff, leave approvals, and payroll.`}
        icon="iconamoon:profile-circle-duotone"
        actions={
          <Button variant="primary" className="rounded-pill shadow px-4 fw-bold" onClick={() => navigate('/pages/add-employee')}>
            <IconifyIcon icon="iconamoon:profile-add-duotone" className="me-1" /> Add New Staff
          </Button>
        }
      />

      <Tab.Container activeKey={activeTab} onSelect={(k: any) => setActiveTab(k)}>
        <Card className="border-0 shadow-sm rounded-4 mb-4">
          <Card.Body className="p-2">
            <Nav variant="pills" className="gap-2">
              <Nav.Item>
                <Nav.Link 
                  eventKey="members" 
                  className={`px-4 py-2 fw-bold rounded-pill text-uppercase fs-12 ${activeTab === 'members' ? 'bg-primary text-white shadow-sm' : 'text-secondary bg-transparent'}`}
                  style={{ cursor: 'pointer' }}
                >
                  <IconifyIcon icon="iconamoon:profile-circle-duotone" className="me-1.5 fs-15" /> Team Directory ({displayedEmployees.length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  eventKey="leaves" 
                  className={`px-4 py-2 fw-bold rounded-pill text-uppercase fs-12 ${activeTab === 'leaves' ? 'bg-primary text-white shadow-sm' : 'text-secondary bg-transparent'}`}
                  style={{ cursor: 'pointer' }}
                >
                  <IconifyIcon icon="iconamoon:calendar-duotone" className="me-1.5 fs-15" /> Leave Requests Approvals ({sortedLeaves.filter(l => l.status === 'Pending').length} Pending)
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Body>
        </Card>

        <Tab.Content>
          <Tab.Pane eventKey="members">
            <Row>
              {loading ? (
                <Col xs={12} className="text-center p-5"><h4>Loading Team...</h4></Col>
              ) : displayedEmployees.length > 0 ? (
                displayedEmployees.map((emp) => (
                  <Col md={6} xl={4} key={emp._id} className="mb-4">
                    <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                      <Card.Body className="p-4">
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <img
                            src={resolveAvatar(emp.avatar, emp.name)}
                            alt={emp.name}
                            onError={handleAvatarError}
                            className="rounded-circle border border-2 border-primary border-opacity-10 p-1"
                            style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                          />
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-1.5 flex-wrap">
                              <h5 className="fw-bold mb-0 text-truncate" style={{ maxWidth: '130px' }}>{emp.name}</h5>
                              {emp.role && (
                                <Badge bg={emp.role === 'admin' ? 'danger' : emp.role === 'manager' ? 'info' : 'success'} className="rounded-pill fs-10 px-2 py-0.5 text-capitalize text-white">
                                  {emp.role}
                                </Badge>
                              )}
                            </div>
                            <p className="text-primary small fw-medium mb-0">{emp.designation}</p>
                            <Badge bg="soft-info" className="text-info rounded-pill small mt-1">{emp.employeeId || 'ID Pending'}</Badge>
                          </div>
                          <div className="ms-auto align-self-start">
                             <Button variant="link" className="text-danger p-0" onClick={() => deleteEmployee(emp._id)}>
                                <IconifyIcon icon="iconamoon:trash-duotone" />
                             </Button>
                          </div>
                        </div>
                        
                        <div className="bg-light bg-opacity-50 rounded-3 p-3 mb-3">
                          <Row className="g-2">
                             <Col xs={6}>
                                <p className="text-muted small mb-0">Department</p>
                                <p className="small fw-bold mb-0">{emp.department || 'N/A'}</p>
                             </Col>
                             <Col xs={6}>
                                <p className="text-muted small mb-0">Joining Date</p>
                                <p className="small fw-bold mb-0">{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}</p>
                             </Col>
                          </Row>
                        </div>

                        <div className="d-flex flex-column gap-2">
                          <div className="d-flex align-items-center gap-2 text-muted small">
                             <IconifyIcon icon="iconamoon:phone-duotone" width={16} />
                             <span>{emp.phone || 'No phone'}</span>
                          </div>
                          <div className="d-flex align-items-center gap-2 text-muted small">
                             <IconifyIcon icon="iconamoon:email-duotone" width={16} />
                             <span className="text-truncate">{emp.email}</span>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                           <div className="text-success fw-bold">₹{emp.salary?.toLocaleString() || '0'} <span className="text-muted small fw-normal">/mo</span></div>
                           <div className="d-flex gap-2">
                              <Button variant="soft-primary" size="sm" onClick={() => navigate(`/pages/employee-profile/${emp._id}`)}>
                                 <IconifyIcon icon="iconamoon:eye-duotone" />
                              </Button>
                              <Button variant="soft-warning" size="sm" onClick={() => navigate(`/pages/edit-employee/${emp._id}`)}>
                                 <IconifyIcon icon="iconamoon:edit-duotone" />
                              </Button>
                              <Badge bg={emp.status === 'Active' ? 'success' : 'warning'} className="rounded-pill">{emp.status}</Badge>
                           </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col xs={12} className="text-center p-5 text-muted">
                  <div className="mb-3"><IconifyIcon icon="iconamoon:profile-circle-duotone" width={64} height={64} className="opacity-25" /></div>
                  <h5>No employees found.</h5>
                  <p>Start by adding a new staff member to the team.</p>
                </Col>
              )}
            </Row>
          </Tab.Pane>

          <Tab.Pane eventKey="leaves">
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
              <Card.Body className="p-0">
                {sortedLeaves.length > 0 ? (
                  <Table responsive hover className="mb-0 align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-4 py-3 text-muted small text-uppercase">Employee</th>
                        <th className="py-3 text-muted small text-uppercase">Leave Type</th>
                        <th className="py-3 text-muted small text-uppercase">Duration</th>
                        <th className="py-3 text-muted small text-uppercase" style={{ width: '35%' }}>Reason</th>
                        <th className="py-3 text-muted small text-uppercase">Status</th>
                        <th className="py-3 text-muted text-end px-4 small text-uppercase" style={{ width: '20%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedLeaves.map((leave: any, idx: number) => (
                        <tr key={idx} className="border-bottom">
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center gap-2.5">
                              <img
                                src={resolveAvatar(leave.employeeAvatar, leave.employeeName)}
                                alt={leave.employeeName}
                                onError={handleAvatarError}
                                className="rounded-circle border border-light"
                                style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                              />
                              <div>
                                <div className="fw-bold text-dark fs-14">{leave.employeeName}</div>
                                <div className="text-muted small">{leave.employeeDesignation}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 fw-bold">{leave.type}</td>
                          <td className="py-3 text-muted small">
                            <IconifyIcon icon="bx:calendar" className="me-1 text-primary" />
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-secondary">{leave.reason}</td>
                          <td className="py-3">
                            <Badge bg={leave.status === 'Approved' ? 'success' : leave.status === 'Pending' ? 'warning' : 'danger'} className="rounded-pill px-2.5 py-1">
                              {leave.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-end px-4">
                            {leave.status === 'Pending' ? (
                              <div className="d-flex gap-2 justify-content-end">
                                <Button variant="soft-success" size="sm" className="fw-bold px-3 py-1 rounded-pill" onClick={() => handleUpdateLeaveStatus(leave.employeeId, leave.leaveIndex, 'Approved')}>
                                  <IconifyIcon icon="bx:check" className="me-1" /> Approve
                                </Button>
                                <Button variant="soft-danger" size="sm" className="fw-bold px-3 py-1 rounded-pill" onClick={() => handleUpdateLeaveStatus(leave.employeeId, leave.leaveIndex, 'Rejected')}>
                                  <IconifyIcon icon="bx:x" className="me-1" /> Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted small italic">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center p-5 text-muted">
                    <IconifyIcon icon="iconamoon:calendar-duotone" className="opacity-25 mb-2" width={64} height={64} />
                    <h5>No leave requests filed yet.</h5>
                    <p className="small m-0">When staff requests leaves via profile, they will appear here centrally.</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
      
      <style>{`
        .fs-12 { font-size: 12px; }
        .fs-15 { font-size: 15px; }
        .gap-1.5 { gap: 6px; }
        .gap-2.5 { gap: 10px; }
      `}</style>
    </div>
  )
}

export default EmployeesPage
