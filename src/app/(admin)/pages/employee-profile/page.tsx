'use client'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardBody, Col, Row, Nav, Tab, Table, Badge, Button, Spinner, Modal, Form } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { resolveAvatar, handleAvatarError } from '@/helpers/avatar'
import { toast } from 'react-toastify'

const EmployeeProfilePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAadhar, setShowAadhar] = useState(false)
  const [showPan, setShowPan] = useState(false)

  const maskSensitive = (value?: string) => {
    if (!value) return 'N/A'
    return '•'.repeat(Math.min(value.replace(/\s/g, '').length || 8, 16))
  }

  const handleResetPassword = async () => {
    if (!employee || !employee.email) return;
    if (!window.confirm(`Reset ${employee.name}'s password to the configured default? Share the new password securely.`)) return;
    
    try {
      const res = await api.post('/auth/admin/reset-password', {
        email: employee.email
      });
      toast.success(`✅ ${res.data.message || 'Password reset successfully!'}`);
    } catch (err: any) {
      console.error(err);
      toast.error('❌ ' + (err.response?.data?.message || 'Failed to reset password.'));
    }
  }

  const fetchEmployee = async () => {
    try {
      const res = await api.get(`/erp/employees`)
      const emp = res.data.find((e: any) => e._id === id)
      setEmployee(emp)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchEmployee() }, [id])

  const handleDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate this account?')) return
    try {
      await api.put(`/erp/employees/${id}`, {
        ...employee,
        status: 'Terminated'
      })
      toast.success('✅ Account Deactivated successfully!')
      fetchEmployee()
    } catch (err) {
      console.error(err)
      toast.error('❌ Failed to deactivate account')
    }
  }

  const handleActivate = async () => {
    if (!window.confirm('Are you sure you want to activate this account?')) return
    try {
      await api.put(`/erp/employees/${id}`, {
        ...employee,
        status: 'Active'
      })
      toast.success('✅ Account Activated successfully!')
      fetchEmployee()
    } catch (err) {
      console.error(err)
      toast.error('❌ Failed to activate account')
    }
  }

  // Modals visibility states
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)

  // Forms states
  const [leaveForm, setLeaveForm] = useState({
    type: 'Sick',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'Pending'
  })

  const [payoutForm, setPayoutForm] = useState({
    month: '',
    amount: '',
    status: 'Paid'
  })

  const [docForm, setDocForm] = useState({
    name: '',
    url: ''
  })

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const updatedLeaves = [...(employee.leaves || []), leaveForm]
      await api.put(`/erp/employees/${id}`, {
        ...employee,
        leaves: updatedLeaves
      })
      toast.success('✅ Leave request added successfully!')
      setShowLeaveModal(false)
      setLeaveForm({ type: 'Sick', startDate: '', endDate: '', reason: '', status: 'Pending' })
      fetchEmployee()
    } catch (err) {
      console.error(err)
      toast.error('❌ Failed to add leave request')
    }
  }

  const handleAddPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const updatedPayroll = [...(employee.payroll || []), {
        ...payoutForm,
        amount: Number(payoutForm.amount),
        transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        paidAt: new Date().toISOString()
      }]
      await api.put(`/erp/employees/${id}`, {
        ...employee,
        payroll: updatedPayroll
      })
      toast.success('✅ Salary payout processed successfully!')
      setShowPayoutModal(false)
      setPayoutForm({ month: '', amount: '', status: 'Paid' })
      fetchEmployee()
    } catch (err) {
      console.error(err)
      toast.error('❌ Failed to process payout')
    }
  }

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const updatedDocs = [...(employee.documents || []), {
        ...docForm,
        uploadedAt: new Date().toISOString()
      }]
      await api.put(`/erp/employees/${id}`, {
        ...employee,
        documents: updatedDocs
      })
      toast.success('✅ Document uploaded successfully!')
      setShowDocModal(false)
      setDocForm({ name: '', url: '' })
      fetchEmployee()
    } catch (err) {
      console.error(err)
      toast.error('❌ Failed to upload document')
    }
  }

  const handleUpdateLeaveStatus = async (index: number, newStatus: 'Approved' | 'Rejected') => {
    try {
      const updatedLeaves = [...(employee.leaves || [])]
      updatedLeaves[index] = { ...updatedLeaves[index], status: newStatus }
      
      await api.put(`/erp/employees/${id}`, {
        ...employee,
        leaves: updatedLeaves
      })
      
      toast.success(`✅ Leave request successfully ${newStatus}!`)
      fetchEmployee()
    } catch (err) {
      console.error(err)
      toast.error('❌ Failed to update leave status')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setDocForm({
          ...docForm,
          url: reader.result as string
        })
      }
      reader.readAsDataURL(file)
    }
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Spinner animation="border" variant="primary" />
    </div>
  )

  if (!employee) return <div className="p-5 text-center"><h4>Employee not found</h4></div>

  return (
    <div className="p-4" id="employee-profile-container">
      <style>
        {`
          .profile-header { background: linear-gradient(135deg, #FF4D00 0%, #1e2229 100%); border-radius: 1.5rem; padding: 3rem; color: white; margin-bottom: 2rem; position: relative; overflow: hidden; }
          .profile-header::after { content: ''; position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(255,255,255,0.05); border-radius: 50%; }
          .profile-avatar { width: 120px; height: 120px; border: 4px solid rgba(255,255,255,0.2); border-radius: 50%; object-fit: cover; }
          .card-custom { border: none; border-radius: 1rem; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
          .nav-pills .nav-link { border-radius: 0.5rem; padding: 0.75rem 1.5rem; font-weight: 600; color: #6c757d; }
          .nav-pills .nav-link.active { background-color: #FF4D00; color: white; }
          .info-label { font-size: 0.75rem; font-weight: 700; color: #adb5bd; text-transform: uppercase; margin-bottom: 0.25rem; }
          .info-value { font-size: 1rem; font-weight: 600; color: #343a40; }
        `}
      </style>

      {/* --- HEADER --- */}
      <div className="profile-header shadow-lg">
        <Row className="align-items-center">
          <Col md="auto">
            <img
              src={resolveAvatar(employee.avatar, employee.name)}
              alt={employee.name}
              onError={handleAvatarError}
              className="profile-avatar shadow"
            />
          </Col>
          <Col className="mt-3 mt-md-0">
            <div className="d-flex align-items-center gap-2 mb-2">
               <h2 className="fw-bold mb-0">{employee.name}</h2>
               {employee.role && (
                 <Badge bg={employee.role === 'admin' ? 'danger' : employee.role === 'manager' ? 'info' : 'success'} className="rounded-pill px-2.5 py-1 text-capitalize text-white fs-12">
                    {employee.role}
                 </Badge>
               )}
               <Badge bg="success" className="rounded-pill px-3 py-2">{employee.status}</Badge>
            </div>
            <p className="fs-5 opacity-75 mb-2">{employee.designation} • {employee.department}</p>
            <div className="d-flex gap-4 opacity-75">
               <div className="d-flex align-items-center gap-2"><IconifyIcon icon="iconamoon:profile-circle-duotone" /> {employee.employeeId}</div>
               <div className="d-flex align-items-center gap-2"><IconifyIcon icon="iconamoon:calendar-duotone" /> Joined {new Date(employee.joiningDate).toLocaleDateString()}</div>
            </div>
          </Col>
          <Col md="auto" className="mt-4 mt-md-0 text-md-end">
             <Button variant="light" className="rounded-pill px-4 fw-bold shadow-sm" onClick={() => navigate(-1)}>
                <IconifyIcon icon="iconamoon:arrow-left-duotone" className="me-2" /> Back to Team
             </Button>
          </Col>
        </Row>
      </div>

      <Tab.Container defaultActiveKey="overview">
        <Row>
          <Col lg={3} className="mb-4">
             <Card className="card-custom mb-4">
                <CardBody className="p-4">
                   <h5 className="fw-bold mb-4">Navigation</h5>
                   <Nav variant="pills" className="flex-column gap-2">
                      <Nav.Item><Nav.Link eventKey="overview">Overview</Nav.Link></Nav.Item>
                      <Nav.Item><Nav.Link eventKey="documents">Documents</Nav.Link></Nav.Item>
                      <Nav.Item><Nav.Link eventKey="payroll">Payroll & Bank</Nav.Link></Nav.Item>
                      <Nav.Item><Nav.Link eventKey="leaves">Leave Requests</Nav.Link></Nav.Item>
                      <Nav.Item><Nav.Link eventKey="attendance">Attendance & Tasks</Nav.Link></Nav.Item>
                   </Nav>
                </CardBody>
             </Card>

              <Card className="card-custom bg-light border-0">
                 <CardBody className="p-4">
                    <h6 className="fw-bold mb-3">Quick Actions</h6>
                    <div className="d-grid gap-2">
                        <Button variant="outline-primary" className="text-start" onClick={() => navigate(`/pages/edit-employee/${id}`)}>
                           <IconifyIcon icon="iconamoon:edit-duotone" className="me-2" /> Edit Profile
                        </Button>
                        <Button variant="outline-warning" className="text-start" onClick={handleResetPassword}>
                           <IconifyIcon icon="iconamoon:lock-duotone" className="me-2" /> Reset Password
                        </Button>
                       {employee.status === 'Active' ? (
                          <Button variant="outline-danger" className="text-start" onClick={handleDeactivate}>
                             <IconifyIcon icon="iconamoon:block-duotone" className="me-2" /> Deactivate Account
                          </Button>
                       ) : (
                          <Button variant="outline-success" className="text-start" onClick={handleActivate}>
                             <IconifyIcon icon="iconamoon:check-circle-duotone" className="me-2" /> Activate Account
                          </Button>
                       )}
                    </div>
                 </CardBody>
              </Card>
          </Col>

          <Col lg={9}>
             <Tab.Content>
                {/* --- OVERVIEW --- */}
                <Tab.Pane eventKey="overview">
                   <Card className="card-custom mb-4">
                      <CardBody className="p-4">
                         <h5 className="fw-bold mb-4">Personal Details</h5>
                         <Row className="mb-4">
                            <Col md={4} className="mb-3">
                               <p className="info-label">Email Address</p>
                               <p className="info-value">{employee.email}</p>
                            </Col>
                            <Col md={4} className="mb-3">
                               <p className="info-label">Mobile Number</p>
                               <p className="info-value">{employee.phone}</p>
                            </Col>
                            <Col md={4} className="mb-3">
                               <p className="info-label">Alternate Number</p>
                               <p className="info-value">{employee.alternatePhone || 'N/A'}</p>
                            </Col>
                            <Col md={4} className="mb-3">
                               <p className="info-label">Gender</p>
                               <p className="info-value">{employee.gender || 'N/A'}</p>
                            </Col>
                            <Col md={4} className="mb-3">
                               <p className="info-label">Date of Birth</p>
                               <p className="info-value">{employee.dob ? new Date(employee.dob).toLocaleDateString() : 'N/A'}</p>
                            </Col>
                            <Col md={4} className="mb-3">
                               <p className="info-label">Monthly Salary</p>
                               <p className="info-value text-success">₹{employee.salary?.toLocaleString()}</p>
                            </Col>
                            <Col md={4} className="mb-3">
                               <p className="info-label">Aadhar Card Number</p>
                               <p className="info-value d-flex align-items-center gap-2 mb-0">
                                 <span>{showAadhar ? (employee.aadharNumber || 'N/A') : maskSensitive(employee.aadharNumber)}</span>
                                 {employee.aadharNumber && (
                                   <button
                                     type="button"
                                     className="btn btn-link p-0 text-primary"
                                     onClick={() => setShowAadhar((v) => !v)}
                                     title={showAadhar ? 'Hide Aadhar' : 'Show Aadhar'}
                                     style={{ lineHeight: 1 }}
                                   >
                                     <IconifyIcon icon={showAadhar ? 'iconamoon:eye-off-duotone' : 'iconamoon:eye-duotone'} style={{ width: 18, height: 18 }} />
                                   </button>
                                 )}
                               </p>
                            </Col>
                            <Col md={4} className="mb-3">
                               <p className="info-label">PAN Card Number</p>
                               <p className="info-value d-flex align-items-center gap-2 mb-0">
                                 <span>{showPan ? (employee.panNumber || 'N/A') : maskSensitive(employee.panNumber)}</span>
                                 {employee.panNumber && (
                                   <button
                                     type="button"
                                     className="btn btn-link p-0 text-primary"
                                     onClick={() => setShowPan((v) => !v)}
                                     title={showPan ? 'Hide PAN' : 'Show PAN'}
                                     style={{ lineHeight: 1 }}
                                   >
                                     <IconifyIcon icon={showPan ? 'iconamoon:eye-off-duotone' : 'iconamoon:eye-duotone'} style={{ width: 18, height: 18 }} />
                                   </button>
                                 )}
                               </p>
                            </Col>
                         </Row>
                         <hr />
                         <h5 className="fw-bold mb-4 mt-4">Address Information</h5>
                         <p className="info-label">Residential Address</p>
                         <p className="info-value">{employee.address || 'No address provided'}</p>
                      </CardBody>
                   </Card>

                   <Card className="card-custom">
                      <CardBody className="p-4">
                         <h5 className="fw-bold mb-4">Emergency Contact</h5>
                         <Row>
                            <Col md={6}>
                               <p className="info-label">Contact Name</p>
                               <p className="info-value">{employee.emergencyContact?.name || 'N/A'}</p>
                            </Col>
                            <Col md={6}>
                               <p className="info-label">Contact Number</p>
                               <p className="info-value">{employee.emergencyContact?.phone || 'N/A'}</p>
                            </Col>
                         </Row>
                      </CardBody>
                   </Card>
                </Tab.Pane>

                {/* --- DOCUMENTS --- */}
                <Tab.Pane eventKey="documents">
                   <Card className="card-custom">
                      <CardBody className="p-4">
                         <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold m-0">Employee Documents</h5>
                            <Button variant="soft-primary" size="sm" onClick={() => setShowDocModal(true)}>Upload Document</Button>
                         </div>
                         {employee.documents && employee.documents.length > 0 ? (
                            <Table responsive borderless className="align-middle">
                               <thead className="bg-light">
                                  <tr>
                                     <th className="py-3">Document Name</th>
                                     <th className="py-3">Uploaded Date</th>
                                     <th className="py-3 text-end">Action</th>
                                  </tr>
                               </thead>
                               <tbody>
                                  {employee.documents.map((doc: any, i: number) => (
                                     <tr key={i} className="border-bottom">
                                        <td className="py-3 fw-bold"><IconifyIcon icon="iconamoon:file-document-duotone" className="text-primary me-2" /> {doc.name}</td>
                                        <td className="py-3 text-muted">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                                        <td className="py-3 text-end">
                                           <Button variant="soft-primary" size="sm" onClick={() => window.open(doc.url, '_blank')}>
                                              View / Download
                                           </Button>
                                        </td>
                                     </tr>
                                  ))}
                               </tbody>
                            </Table>
                         ) : (
                            <div className="text-center p-5 text-muted">No documents uploaded.</div>
                         )}
                      </CardBody>
                   </Card>
                </Tab.Pane>

                {/* --- PAYROLL --- */}
                <Tab.Pane eventKey="payroll">
                   <Card className="card-custom mb-4">
                      <CardBody className="p-4">
                         <h5 className="fw-bold mb-4">Bank Account Details</h5>
                         <Row>
                            <Col md={4}>
                               <p className="info-label">Bank Name</p>
                               <p className="info-value">{employee.bankDetails?.bankName || 'N/A'}</p>
                            </Col>
                            <Col md={4}>
                               <p className="info-label">Account Number</p>
                               <p className="info-value">xxxx xxxx {employee.bankDetails?.accountNumber?.slice(-4) || 'N/A'}</p>
                            </Col>
                            <Col md={4}>
                               <p className="info-label">IFSC Code</p>
                               <p className="info-value">{employee.bankDetails?.ifscCode || 'N/A'}</p>
                            </Col>
                         </Row>
                      </CardBody>
                   </Card>

                   <Card className="card-custom">
                      <CardBody className="p-4">
                         <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold m-0">Salary Payout History</h5>
                            <Button variant="soft-success" size="sm" onClick={() => {
                                setPayoutForm({ ...payoutForm, amount: employee.salary?.toString() || '' })
                                setShowPayoutModal(true)
                             }}>Process Payout</Button>
                         </div>
                         {employee.payroll && employee.payroll.length > 0 ? (
                            <Table responsive borderless>
                               <thead className="bg-light">
                                  <tr>
                                     <th className="py-3">Month</th>
                                     <th className="py-3">Amount</th>
                                     <th className="py-3">Status</th>
                                      <th className="py-3 text-end">Action</th>
                                     <th className="py-3">Date</th>
                                  </tr>
                               </thead>
                               <tbody>
                                  {employee.payroll.map((pay: any, i: number) => (
                                     <tr key={i} className="border-bottom">
                                        <td className="py-3 fw-bold">{pay.month}</td>
                                        <td className="py-3 text-success fw-bold">₹{pay.amount.toLocaleString()}</td>
                                        <td className="py-3"><Badge bg="success" className="rounded-pill">{pay.status}</Badge></td>
                                        <td className="py-3 text-muted">{new Date(pay.paidAt).toLocaleDateString()}</td>
                                     </tr>
                                  ))}
                               </tbody>
                            </Table>
                         ) : (
                            <div className="text-center p-5 text-muted">No payout history found.</div>
                         )}
                      </CardBody>
                   </Card>
                </Tab.Pane>

                {/* --- LEAVES --- */}
                <Tab.Pane eventKey="leaves">
                   <Card className="card-custom">
                      <CardBody className="p-4">
                         <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold m-0">Leave History</h5>
                            <Button variant="soft-primary" size="sm" onClick={() => setShowLeaveModal(true)}>Request Leave</Button>
                         </div>
                         {employee.leaves && employee.leaves.length > 0 ? (
                            <Table responsive borderless>
                               <thead className="bg-light">
                                  <tr>
                                     <th className="py-3">Type</th>
                                     <th className="py-3">Duration</th>
                                     <th className="py-3">Reason</th>
                                     <th className="py-3">Status</th>
                                  </tr>
                               </thead>
                               <tbody>
                                  {employee.leaves.map((leave: any, i: number) => (
                                     <tr key={i} className="border-bottom">
                                        <td className="py-3 fw-bold">{leave.type}</td>
                                        <td className="py-3 small text-muted">{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</td>
                                        <td className="py-3">{leave.reason}</td>
                                        <td className="py-3">
                                            <Badge bg={leave.status === 'Approved' ? 'success' : leave.status === 'Pending' ? 'warning' : 'danger'}>{leave.status}</Badge>
                                         </td>
                                         <td className="py-3 text-end">
                                            {leave.status === 'Pending' && (
                                               <div className="d-flex gap-2 justify-content-end">
                                                  <Button variant="soft-success" size="sm" onClick={() => handleUpdateLeaveStatus(i, 'Approved')} className="fw-bold rounded">
                                                     <IconifyIcon icon="bx:check" className="me-1" /> Approve
                                                  </Button>
                                                  <Button variant="soft-danger" size="sm" onClick={() => handleUpdateLeaveStatus(i, 'Rejected')} className="fw-bold rounded">
                                                     <IconifyIcon icon="bx:x" className="me-1" /> Reject
                                                  </Button>
                                               </div>
                                            )}
                                         </td>
                                     </tr>
                                  ))}
                               </tbody>
                            </Table>
                         ) : (
                            <div className="text-center p-5 text-muted">No leave requests found.</div>
                         )}
                      </CardBody>
                   </Card>
                </Tab.Pane>

                {/* --- ATTENDANCE & TASKS --- */}
                <Tab.Pane eventKey="attendance">
                   <Row className="g-4">
                      <Col md={6}>
                         <Card className="card-custom h-100">
                            <CardBody className="p-4">
                               <h5 className="fw-bold mb-4">Attendance History</h5>
                               {employee.attendance && employee.attendance.length > 0 ? (
                                  <Table responsive borderless className="align-middle">
                                     <thead className="bg-light">
                                        <tr>
                                           <th className="py-2.5">Date</th>
                                           <th className="py-2.5">Clock In</th>
                                           <th className="py-2.5">Clock Out</th>
                                           <th className="py-2.5 text-end">Duration</th>
                                        </tr>
                                     </thead>
                                     <tbody>
                                        {[...employee.attendance].reverse().map((att: any, idx: number) => (
                                           <tr key={idx} className="border-bottom">
                                              <td className="py-2.5 fw-bold">{new Date(att.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                                              <td className="py-2.5 text-success">{new Date(att.clockIn).toLocaleTimeString(undefined, { timeStyle: 'short' })}</td>
                                              <td className="py-2.5 text-danger">
                                                 {att.clockOut ? new Date(att.clockOut).toLocaleTimeString(undefined, { timeStyle: 'short' }) : '--'}
                                              </td>
                                              <td className="py-2.5 text-end fw-bold">{att.duration ? `${att.duration} hrs` : '--'}</td>
                                           </tr>
                                        ))}
                                     </tbody>
                                  </Table>
                               ) : (
                                  <div className="text-center py-5 text-muted">No attendance logs logged yet.</div>
                               )}
                            </CardBody>
                         </Card>
                      </Col>
                      <Col md={6}>
                         <Card className="card-custom h-100">
                            <CardBody className="p-4">
                               <h5 className="fw-bold mb-4">Project Work Logs</h5>
                               {employee.timeLogs && employee.timeLogs.length > 0 ? (
                                  <Table responsive borderless className="align-middle">
                                     <thead className="bg-light">
                                        <tr>
                                           <th className="py-2.5">Project</th>
                                           <th className="py-2.5">Task Description</th>
                                           <th className="py-2.5 text-end">Hours</th>
                                        </tr>
                                     </thead>
                                     <tbody>
                                        {[...employee.timeLogs].reverse().map((log: any, idx: number) => (
                                           <tr key={idx} className="border-bottom">
                                              <td className="py-2.5 fw-bold text-primary">{log.projectName}</td>
                                              <td className="py-2.5 text-muted small">{log.taskDescription}</td>
                                              <td className="py-2.5 text-end fw-bold text-dark">{log.duration} hrs</td>
                                           </tr>
                                        ))}
                                     </tbody>
                                  </Table>
                               ) : (
                                  <div className="text-center py-5 text-muted">No task logs entered yet.</div>
                               )}
                            </CardBody>
                         </Card>
                      </Col>
                   </Row>
                </Tab.Pane>
             </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>

      {/* --- LEAVE REQUEST MODAL --- */}
      <Modal show={showLeaveModal} onHide={() => setShowLeaveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Request Leave</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddLeave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Leave Type</Form.Label>
              <Form.Select 
                value={leaveForm.type} 
                onChange={(e: any) => setLeaveForm({ ...leaveForm, type: e.target.value })}
              >
                <option value="Sick">Sick Leave</option>
                <option value="Casual">Casual Leave</option>
                <option value="Earned">Earned Leave</option>
                <option value="Unpaid">Unpaid Leave</option>
              </Form.Select>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-muted">Start Date *</Form.Label>
                  <Form.Control 
                    type="date" 
                    required 
                    value={leaveForm.startDate} 
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-muted">End Date *</Form.Label>
                  <Form.Control 
                    type="date" 
                    required 
                    value={leaveForm.endDate} 
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Reason *</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                required 
                placeholder="Reason for leave"
                value={leaveForm.reason} 
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" className="rounded-pill px-4" onClick={() => setShowLeaveModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="rounded-pill px-4 shadow">
              Submit Request
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* --- SALARY PAYOUT MODAL --- */}
      <Modal show={showPayoutModal} onHide={() => setShowPayoutModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Process Salary Payout</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddPayout}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Month *</Form.Label>
              <Form.Control 
                type="text" 
                required 
                placeholder="e.g. May 2026, June 2026"
                value={payoutForm.month} 
                onChange={(e) => setPayoutForm({ ...payoutForm, month: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Payout Amount (₹) *</Form.Label>
              <Form.Control 
                type="number" 
                required 
                placeholder="Enter amount"
                value={payoutForm.amount} 
                onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" className="rounded-pill px-4" onClick={() => setShowPayoutModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit" className="rounded-pill px-4 shadow text-white">
              Process Payment
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* --- DOCUMENT UPLOAD MODAL --- */}
      <Modal show={showDocModal} onHide={() => setShowDocModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Upload Employee Document</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddDoc}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Document Name *</Form.Label>
              <Form.Control 
                type="text" 
                required 
                placeholder="e.g. Resume, Aadhaar Card, Contract"
                value={docForm.name} 
                onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Select File *</Form.Label>
              <Form.Control 
                type="file" 
                required 
                onChange={handleFileChange}
              />
              <Form.Text className="text-muted">
                Choose a local PDF or Image to attach to this employee's profile.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" className="rounded-pill px-4" onClick={() => setShowDocModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="rounded-pill px-4 shadow">
              Upload Document
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}

export default EmployeeProfilePage
