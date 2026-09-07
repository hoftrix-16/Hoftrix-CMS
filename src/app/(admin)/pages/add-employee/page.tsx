'use client'
import { useState } from 'react'
import { Card, CardBody, Col, Row, Form, Button, InputGroup } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

const AddEmployeePage = () => {
  const idPrefix = 'EMP-HTF-'
  
  const [idNumber, setIdNumber] = useState('')
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
    joiningDate: new Date().toISOString().split('T')[0],
    dob: '',
    gender: 'Male',
    aadharNumber: '',
    panNumber: '',
    address: '',
    salary: '',
    bankDetails: {
      accountNumber: '',
      bankName: '',
      ifscCode: ''
    },
    emergencyContact: {
      name: '',
      phone: ''
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Combine prefix and number
    const finalEmployeeId = idPrefix + idNumber
    const submissionData = { ...formData, employeeId: finalEmployeeId }

    try {
      await api.post('/erp/employees', submissionData)
      toast.success(
        `Employee added. Login: ${submissionData.email} / default password from server (see backend .env DEFAULT_EMPLOYEE_PASSWORD)`,
        { autoClose: 8000 },
      )
      toast.info('Employee can sign in at /auth/sign-in with their email + default password, then change it from Profile.', {
        autoClose: 10000,
      })
      setIdNumber('')
      setFormData({
        employeeId: '',
        name: '',
        email: '',
        phone: '',
        alternatePhone: '',
        designation: '',
        department: '',
        joiningDate: new Date().toISOString().split('T')[0],
        dob: '',
        gender: 'Male',
        aadharNumber: '',
        panNumber: '',
        address: '',
        salary: '',
        bankDetails: { accountNumber: '', bankName: '', ifscCode: '' },
        emergencyContact: { name: '', phone: '' }
      })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add employee')
    }
  }

  return (
    <div className="p-4" id="add-employee-container">
      <style>
        {`
          #add-employee-container .iconify { width: 24px; height: 24px; }
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
                <div className="bg-primary bg-opacity-10 p-3 rounded-3">
                  <IconifyIcon icon="iconamoon:profile-add-duotone" className="text-primary fs-2" />
                </div>
                <div>
                  <h4 className="fw-bold mb-1">Add New Employee</h4>
                  <p className="text-muted mb-0">Fill in the professional and personal details of the new team member.</p>
                </div>
              </div>

              <Form onSubmit={handleSubmit}>
                {/* --- BASIC INFO --- */}
                <div className="section-title">
                  <IconifyIcon icon="iconamoon:information-circle-duotone" /> Basic Information <hr />
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
                          type="text" className="form-control-custom border-start-0 ps-0" placeholder="0001" required 
                          value={idNumber} onChange={(e) => setIdNumber(e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Full Name *</Form.Label>
                      <Form.Control 
                        type="text" className="form-control-custom" placeholder="e.g. John Doe" required 
                        value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Email Address *</Form.Label>
                      <Form.Control 
                        type="email" className="form-control-custom" placeholder="john@hoftrix.com" required 
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
                        type="text" className="form-control-custom" placeholder="e.g. Senior Developer" required 
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
                        <option value="">Select Department</option>
                        <option value="IT">IT / Development</option>
                        <option value="Design">Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="HR">HR</option>
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
                        type="text" className="form-control-custom" placeholder="+91 98765 43210" required 
                        value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Alternate Number</Form.Label>
                      <Form.Control 
                        type="text" className="form-control-custom" placeholder="+91 88888 00000" 
                        value={formData.alternatePhone} onChange={(e) => setFormData({...formData, alternatePhone: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Gender</Form.Label>
                      <div className="d-flex gap-3 mt-1">
                        {['Male', 'Female', 'Other'].map(g => (
                          <Form.Check 
                            key={g} type="radio" label={g} name="gender" id={`gender-${g}`} className="text-light"
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
                    as="textarea" rows={2} className="form-control-custom" placeholder="Street, City, State, ZIP..." 
                    value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </Form.Group>

                {/* --- BANK & EMERGENCY --- */}
                <Row>
                  <Col md={6}>
                    <div className="section-title mt-4">
                      <IconifyIcon icon="iconamoon:file-document-duotone" /> Bank Details <hr />
                    </div>
                    <Form.Group className="mb-3">
                      <Form.Label className="form-label-custom">Bank Name</Form.Label>
                      <Form.Control 
                        type="text" className="form-control-custom" placeholder="SBI, HDFC, etc." 
                        value={formData.bankDetails.bankName} onChange={(e) => setFormData({...formData, bankDetails: {...formData.bankDetails, bankName: e.target.value}})}
                      />
                    </Form.Group>
                    <Row>
                      <Col md={7}>
                        <Form.Group className="mb-3">
                          <Form.Label className="form-label-custom">Account Number</Form.Label>
                          <Form.Control 
                            type="text" className="form-control-custom" placeholder="0000 0000 0000" 
                            value={formData.bankDetails.accountNumber} onChange={(e) => setFormData({...formData, bankDetails: {...formData.bankDetails, accountNumber: e.target.value}})}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={5}>
                        <Form.Group className="mb-3">
                          <Form.Label className="form-label-custom">IFSC Code</Form.Label>
                          <Form.Control 
                            type="text" className="form-control-custom" placeholder="SBIN000..." 
                            value={formData.bankDetails.ifscCode} onChange={(e) => setFormData({...formData, bankDetails: {...formData.bankDetails, ifscCode: e.target.value}})}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Col>
                  <Col md={6}>
                    <div className="section-title mt-4">
                      <IconifyIcon icon="iconamoon:shield-alert-duotone" /> Emergency Contact <hr />
                    </div>
                    <Form.Group className="mb-3">
                      <Form.Label className="form-label-custom">Contact Name</Form.Label>
                      <Form.Control 
                        type="text" className="form-control-custom" placeholder="Relative's Name" 
                        value={formData.emergencyContact.name} onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, name: e.target.value}})}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="form-label-custom">Contact Number</Form.Label>
                      <Form.Control 
                        type="text" className="form-control-custom" placeholder="Relative's Phone" 
                        value={formData.emergencyContact.phone} onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, phone: e.target.value}})}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* --- DOCUMENTS & PAYROLL --- */}
                <Row>
                  <Col md={6}>
                    <div className="section-title mt-4">
                      <IconifyIcon icon="iconamoon:file-document-duotone" /> Documents (Links) <hr />
                    </div>
                    <Form.Group className="mb-3">
                      <Form.Label className="form-label-custom">Resume / CV URL</Form.Label>
                      <Form.Control 
                        type="text" className="form-control-custom" placeholder="https://drive.google.com/..." 
                        onChange={(e) => {
                          const docs = [...(formData as any).documents || []];
                          docs[0] = { name: 'Resume', url: e.target.value };
                          setFormData({...formData, documents: docs} as any);
                        }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="form-label-custom">ID Proof URL (Aadhar/PAN)</Form.Label>
                      <Form.Control 
                        type="text" className="form-control-custom" placeholder="https://drive.google.com/..." 
                        onChange={(e) => {
                          const docs = [...(formData as any).documents || []];
                          docs[1] = { name: 'ID Proof', url: e.target.value };
                          setFormData({...formData, documents: docs} as any);
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <div className="section-title mt-4">
                      <IconifyIcon icon="iconamoon:delivery-duotone" /> Initial Payroll <hr />
                    </div>
                    <Form.Group className="mb-3">
                      <Form.Label className="form-label-custom">Monthly Salary (INR)</Form.Label>
                      <Form.Control 
                        type="number" className="form-control-custom" placeholder="e.g. 50000" 
                        value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="form-label-custom">Salary Status</Form.Label>
                      <Form.Control as="select" className="form-control-custom" disabled>
                        <option>Active / Pending Next Payout</option>
                      </Form.Control>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end gap-3 mt-5">
                  <Button variant="outline-secondary" className="px-5 rounded-pill py-2" onClick={() => window.history.back()}>Back</Button>
                  <Button variant="primary" type="submit" className="px-5 rounded-pill py-2 shadow-lg">Save Employee Record</Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AddEmployeePage
