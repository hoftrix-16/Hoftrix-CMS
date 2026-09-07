'use client'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardBody, Col, Row, Form, Button, InputGroup, Spinner } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

const EditEmployeePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [idPrefix, setIdPrefix] = useState('EMP-HTF-')
  const [idNumber, setIdNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAadhar, setShowAadhar] = useState(false)
  const [showPan, setShowPan] = useState(false)

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    designation: '',
    department: '',
    joiningDate: '',
    dob: '',
    gender: 'Male',
    aadharNumber: '',
    panNumber: '',
    address: '',
    salary: '',
    bankDetails: { accountNumber: '', bankName: '', ifscCode: '' },
    emergencyContact: { name: '', phone: '' },
    documents: [],
    status: 'Active'
  })

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await api.get(`/erp/employees`)
        const emp = res.data.find((e: any) => e._id === id)
        if (emp) {
          // Parse Employee ID if it follows the format
          if (emp.employeeId.includes('-')) {
             const parts = emp.employeeId.split('-')
             const num = parts.pop()
             const prefix = parts.join('-') + '-'
             setIdPrefix(prefix)
             setIdNumber(num)
          } else {
             setIdNumber(emp.employeeId)
          }

          setFormData({
            ...emp,
            aadharNumber: emp.aadharNumber || '',
            panNumber: emp.panNumber || '',
            joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
            dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
          })
        }
      } catch (err) { toast.error('Failed to load employee data') }
      finally { setLoading(false) }
    }
    fetchEmployee()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalEmployeeId = idPrefix.includes('-') ? idPrefix + idNumber : idNumber
    const submissionData = { ...formData, employeeId: finalEmployeeId }

    try {
      await api.put(`/erp/employees/${id}`, submissionData)
      toast.success('✅ Employee Updated Successfully!')
      navigate('/pages/employees')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Spinner animation="border" variant="primary" />
    </div>
  )

  return (
    <div className="p-4" id="edit-employee-container">
      <style>
        {`
          #edit-employee-container .iconify { width: 24px; height: 24px; }
          .card-dark-hoftrix { background-color: #1e2229 !important; border: none !important; color: white !important; }
          .form-label-custom { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #adb5bd; margin-bottom: 0.5rem; }
          .form-control-custom { background-color: rgba(255, 255, 255, 0.05) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; color: white !important; padding: 0.75rem 1rem; }
          .form-control-custom:focus { border-color: #FF4D00 !important; background-color: rgba(255, 255, 255, 0.08) !important; color: white !important; box-shadow: none !important; }
          .form-control-custom option { background-color: #1e2229 !important; color: white !important; }
          .input-group-text-custom { background-color: rgba(255, 255, 255, 0.1) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; color: #FF4D00 !important; font-weight: bold; }
          .section-title { font-size: 1rem; font-weight: 600; color: #FF4D00; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 10px; }
          .section-title hr { flex-grow: 1; border-color: rgba(255, 77, 0, 0.2); }
        `}
      </style>

      <Row className="justify-content-center">
        <Col xl={10}>
          <Card className="card-dark-hoftrix shadow-lg rounded-4">
            <CardBody className="p-5">
              <div className="d-flex align-items-center gap-3 mb-5">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
                  <IconifyIcon icon="iconamoon:edit-duotone" />
                </div>
                <div>
                  <h3 className="fw-bold m-0">Edit Employee</h3>
                  <p className="text-muted small m-0">Update details for {formData.name}</p>
                </div>
              </div>

              <Form onSubmit={handleSubmit}>
                {/* --- BASIC INFO --- */}
                <div className="section-title">
                  <IconifyIcon icon="iconamoon:profile-duotone" /> Personal Information <hr />
                </div>
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Employee ID *</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="input-group-text-custom border-end-0">
                          {idPrefix}
                        </InputGroup.Text>
                        <Form.Control 
                          type="text" className="form-control-custom border-start-0 ps-0" required 
                          value={idNumber} onChange={(e) => setIdNumber(e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Full Name *</Form.Label>
                      <Form.Control 
                        type="text" className="form-control-custom" required 
                        value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Email Address *</Form.Label>
                      <Form.Control 
                        type="email" className="form-control-custom" required 
                        value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Designation *</Form.Label>
                      <Form.Control 
                        type="text" className="form-control-custom" required 
                        value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Department</Form.Label>
                      <Form.Control 
                        as="select" className="form-control-custom"
                        value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}
                      >
                        <option value="IT">IT / Development</option>
                        <option value="Design">UI/UX Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="HR">Human Resources</option>
                        <option value="Sales">Sales</option>
                      </Form.Control>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Joining Date</Form.Label>
                      <Form.Control 
                        type="date" className="form-control-custom" 
                        value={formData.joiningDate} onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Date of Birth</Form.Label>
                      <Form.Control
                        type="date"
                        className="form-control-custom"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* --- CONTACT INFO --- */}
                <div className="section-title mt-4">
                  <IconifyIcon icon="iconamoon:phone-duotone" /> Contact Details <hr />
                </div>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Mobile Number *</Form.Label>
                      <Form.Control 
                        type="text" className="form-control-custom" required 
                        value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Alternate Number</Form.Label>
                      <Form.Control 
                        type="text" className="form-control-custom" 
                        value={formData.alternatePhone} onChange={(e) => setFormData({...formData, alternatePhone: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Gender</Form.Label>
                      <div className="d-flex gap-4 mt-2">
                        {['Male', 'Female', 'Other'].map(g => (
                          <Form.Check 
                            key={g} type="radio" label={g} name="gender" 
                            checked={formData.gender === g} onChange={() => setFormData({...formData, gender: g})}
                          />
                        ))}
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Aadhar Card Number</Form.Label>
                      <InputGroup>
                        <Form.Control 
                          type={showAadhar ? 'text' : 'password'} className="form-control-custom" placeholder="XXXX XXXX XXXX"
                          maxLength={14}
                          value={formData.aadharNumber} onChange={(e) => setFormData({...formData, aadharNumber: e.target.value})}
                          autoComplete="off"
                        />
                        <Button
                          type="button"
                          variant="outline-secondary"
                          className="input-group-text-custom border"
                          onClick={() => setShowAadhar((v) => !v)}
                          title={showAadhar ? 'Hide Aadhar' : 'Show Aadhar'}
                        >
                          <IconifyIcon icon={showAadhar ? 'iconamoon:eye-off-duotone' : 'iconamoon:eye-duotone'} />
                        </Button>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">PAN Card Number</Form.Label>
                      <InputGroup>
                        <Form.Control 
                          type={showPan ? 'text' : 'password'} className="form-control-custom" placeholder="ABCDE1234F"
                          maxLength={10}
                          value={formData.panNumber} onChange={(e) => setFormData({...formData, panNumber: e.target.value.toUpperCase()})}
                          autoComplete="off"
                        />
                        <Button
                          type="button"
                          variant="outline-secondary"
                          className="input-group-text-custom border"
                          onClick={() => setShowPan((v) => !v)}
                          title={showPan ? 'Hide PAN' : 'Show PAN'}
                        >
                          <IconifyIcon icon={showPan ? 'iconamoon:eye-off-duotone' : 'iconamoon:eye-duotone'} />
                        </Button>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="form-label-custom">Full Address</Form.Label>
                  <Form.Control 
                    as="textarea" rows={3} className="form-control-custom" 
                    value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </Form.Group>

                {/* --- FINANCIAL & SALARY INFO --- */}
                <div className="section-title mt-4">
                  <IconifyIcon icon="iconamoon:delivery-duotone" /> Salary & Banking Details <hr />
                </div>
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Monthly Salary (₹) *</Form.Label>
                      <Form.Control 
                        type="number" className="form-control-custom" required 
                        value={formData.salary || ''} onChange={(e) => setFormData({...formData, salary: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Bank Name</Form.Label>
                      <Form.Control 
                        type="text" className="form-control-custom" 
                        value={formData.bankDetails?.bankName || ''} 
                        onChange={(e) => setFormData({
                          ...formData, 
                          bankDetails: { ...(formData.bankDetails || {}), bankName: e.target.value } as any
                        })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Account Number</Form.Label>
                      <Form.Control 
                        type="text" className="form-control-custom" 
                        value={formData.bankDetails?.accountNumber || ''} 
                        onChange={(e) => setFormData({
                          ...formData, 
                          bankDetails: { ...(formData.bankDetails || {}), accountNumber: e.target.value } as any
                        })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">IFSC Code</Form.Label>
                      <Form.Control 
                        type="text" className="form-control-custom" 
                        value={formData.bankDetails?.ifscCode || ''} 
                        onChange={(e) => setFormData({
                          ...formData, 
                          bankDetails: { ...(formData.bankDetails || {}), ifscCode: e.target.value } as any
                        })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* --- EMERGENCY CONTACT --- */}
                <div className="section-title mt-4">
                  <IconifyIcon icon="iconamoon:profile-circle-duotone" /> Emergency Contact <hr />
                </div>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Emergency Contact Name</Form.Label>
                      <Form.Control 
                        type="text" className="form-control-custom" 
                        value={formData.emergencyContact?.name || ''} 
                        onChange={(e) => setFormData({
                          ...formData, 
                          emergencyContact: { ...(formData.emergencyContact || {}), name: e.target.value } as any
                        })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Emergency Contact Phone</Form.Label>
                      <Form.Control 
                        type="text" className="form-control-custom" 
                        value={formData.emergencyContact?.phone || ''} 
                        onChange={(e) => setFormData({
                          ...formData, 
                          emergencyContact: { ...(formData.emergencyContact || {}), phone: e.target.value } as any
                        })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end gap-3 mt-5">
                  <Button variant="outline-secondary" className="px-5 rounded-pill py-2" onClick={() => navigate(-1)}>Cancel</Button>
                  <Button variant="primary" type="submit" className="px-5 rounded-pill py-2 shadow-lg">Update Employee</Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default EditEmployeePage
