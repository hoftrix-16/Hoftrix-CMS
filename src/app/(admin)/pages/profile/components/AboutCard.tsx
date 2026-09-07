import { Link, useSearchParams } from 'react-router-dom'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { COMPANY } from '@/config/app'
import small6 from '@/assets/images/small/img-6.jpg'
import { resolveAvatar, handleAvatarError } from '@/helpers/avatar'
import { Button, Card, CardBody, CardFooter, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row, Modal, Form, Badge } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import api from '@/helpers/api'
import { toast } from 'react-toastify'
import { useState, useEffect } from 'react'

const AboutCard = () => {
  const { user, saveSession } = useAuthContext()
  const isAdmin = user?.role === 'admin'
  const [searchParams] = useSearchParams()
  const profileId = searchParams.get('id')

  const [activeUser, setActiveUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loggedInId = user?.id || user?._id
  const isSelf = !profileId || profileId === loggedInId
  const canEdit = isSelf || isAdmin

  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('❌ New passwords do not match!')
      return
    }
    
    try {
      await api.post('/auth/change-password', {
        id: user?.id || user?._id || formData.id,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      toast.success('🔒 Password changed successfully!')
      setShowPasswordModal(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    }
  }

  const handleAdminResetPassword = async () => {
    if (!window.confirm(`Are you sure you want to reset ${activeUser?.name || 'this employee'}'s password back to the default 'welcome@123'?`)) return
    
    try {
      const targetId = activeUser?.id || activeUser?._id
      const response = await api.post('/auth/admin/reset-password', {
        userId: targetId
      })
      toast.success(response.data.message || '🔒 Password successfully reset to default!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password')
    }
  }
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    designation: '',
    bio: '',
    skills: '',
  })

  // Fetch profile from database to ensure fresh data
  useEffect(() => {
    const fetchProfile = async () => {
      const targetId = profileId || loggedInId
      if (targetId) {
        setLoading(true)
        try {
          const response = await api.get(`/auth/profile/${targetId}`)
          setActiveUser(response.data)
          // If viewing own profile, synchronize the local AuthContext session
          if (isSelf && saveSession) {
            saveSession({
              ...user,
              ...response.data,
              id: response.data._id || response.data.id || loggedInId,
              token: user?.token || '',
            } as any)
          }
        } catch (error) {
          console.error('Error fetching profile:', error)
          setActiveUser(user)
        } finally {
          setLoading(false)
        }
      } else {
        setActiveUser(user)
      }
    }
    fetchProfile()
  }, [profileId, loggedInId])

  // Update formData when activeUser changes
  useEffect(() => {
    if (activeUser) {
      setFormData({
        id: activeUser.id || activeUser._id || '',
        name: activeUser.name || '',
        email: activeUser.email || '',
        phone: activeUser.phone || '',
        designation: activeUser.designation || '',
        bio: activeUser.bio || '',
        skills: Array.isArray(activeUser.skills) ? activeUser.skills.join(', ') : '',
      })
    }
  }, [activeUser])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleUpdate = async () => {
    try {
      const payload = {
        ...formData,
        skills: formData.skills ? formData.skills.split(',').map((s) => s.trim()) : [],
      }
      const response = await api.put('/auth/update-profile', payload)
      toast.success('Profile updated successfully!')
      if (isSelf && saveSession) {
        saveSession({
          ...user,
          ...response.data.user,
          token: user?.token || '',
        } as any)
      } else {
        setActiveUser(response.data.user)
      }
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating profile')
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64String = reader.result as string
      try {
        const payload = {
          id: user?.id || user?._id || formData.id,
          avatar: base64String
        }
        const response = await api.put('/auth/update-profile', payload)
        toast.success('📸 Profile picture updated successfully!')
        if (isSelf && saveSession) {
          saveSession({
            ...user,
            avatar: base64String,
            token: user?.token || '',
          } as any)
        } else {
          setActiveUser(response.data.user)
        }
      } catch (error: any) {
        console.error(error)
        toast.error(error.response?.data?.message || 'Error updating profile picture')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64String = reader.result as string
      try {
        const payload = {
          id: user?.id || user?._id || formData.id,
          cover: base64String
        }
        const response = await api.put('/auth/update-profile', payload)
        toast.success('🖼️ Cover picture updated successfully!')
        if (isSelf && saveSession) {
          saveSession({
            ...user,
            cover: base64String,
            token: user?.token || '',
          } as any)
        } else {
          setActiveUser(response.data.user)
        }
      } catch (error: any) {
        console.error(error)
        toast.error(error.response?.data?.message || 'Error updating cover picture')
      }
    }
    reader.readAsDataURL(file)
  }

  const isElevated = isAdmin || user?.role === 'manager'

  if (loading || !activeUser) {
    return (
      <Card className="p-5 text-center border-0 shadow-sm d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <style>{`
        .profile-avatar-container {
          width: 90px;
          height: 90px;
          cursor: pointer;
          z-index: 10;
        }
        .profile-avatar-overlay {
          background: rgba(0, 0, 0, 0.5);
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
        }
        .profile-avatar-container:hover .profile-avatar-overlay {
          opacity: 1;
        }
      `}</style>
      <div className="position-relative">
        <img 
          src={activeUser?.cover || small6} 
          alt="cover" 
          className="card-img rounded-bottom-0 object-fit-cover w-100" 
          height={400} 
        />
        
        {canEdit && (
          <>
            <button 
              className="btn btn-sm border-0 shadow-sm position-absolute d-flex align-items-center gap-1 text-white" 
              style={{ 
                top: '15px', 
                right: '15px', 
                background: 'rgba(0, 0, 0, 0.75)', 
                backdropFilter: 'blur(10px)', 
                fontWeight: 600, 
                zIndex: 10, 
                borderRadius: '20px', 
                padding: '0.4rem 0.9rem',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                fontSize: '13px'
              }}
              onClick={() => document.getElementById('cover-upload-input')?.click()}
            >
              <IconifyIcon icon="bx:camera" className="fs-16 text-white" />
              Change Cover
            </button>

            <input 
              type="file" 
              id="cover-upload-input" 
              accept="image/*" 
              className="d-none" 
              onChange={handleCoverChange}
            />
          </>
        )}

        <div 
          className="profile-avatar-container position-absolute top-100 start-0 translate-middle-y ms-3 rounded-circle border border-light border-3 overflow-hidden shadow"
          onClick={() => {
            if (canEdit) {
              document.getElementById('avatar-upload-input')?.click()
            }
          }}
          style={{ cursor: canEdit ? 'pointer' : 'default' }}
        >
          <div className="position-relative w-100 h-100">
            <img
              src={resolveAvatar(activeUser?.avatar, activeUser?.name || 'User')}
              alt="avatar"
              onError={handleAvatarError}
              className="w-100 h-100 object-fit-cover"
            />
            {canEdit && (
              <div className="profile-avatar-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                <IconifyIcon icon="bx:camera" className="text-white fs-22" />
              </div>
            )}
          </div>
        </div>

        {canEdit && (
          <input 
            type="file" 
            id="avatar-upload-input" 
            accept="image/*" 
            className="d-none" 
            onChange={handleAvatarChange}
          />
        )}
      </div>
      <CardBody className="mt-4">
        <div>
          <div className="d-flex align-items-center mb-3">
            <div className="d-block w-100">
              {isEditing ? (
                <div className="mb-3 px-2">
                  <label className="form-label fw-bold small text-uppercase">Full Name</label>
                  <input type="text" name="name" className="form-control mb-2" value={formData.name} onChange={handleChange} />
                  
                  <label className="form-label fw-bold small text-uppercase">Designation</label>
                  <input type="text" name="designation" className="form-control mb-2" value={formData.designation} onChange={handleChange} placeholder="e.g. CEO, Developer" />
                  
                  <label className="form-label fw-bold small text-uppercase">About Me</label>
                  <textarea name="bio" className="form-control mb-2" rows={3} value={formData.bio} onChange={handleChange} placeholder="Tell us about yourself..." />

                  <label className="form-label fw-bold small text-uppercase">Skills (SEO, Web Dev...)</label>
                  <input type="text" name="skills" className="form-control mb-2" value={formData.skills} onChange={handleChange} placeholder="Skill 1, Skill 2" />
                  
                  <label className="form-label fw-bold small text-uppercase">Phone</label>
                  <input type="text" name="phone" className="form-control mb-2" value={formData.phone} onChange={handleChange} />
                  
                  <div className="d-flex gap-2 mt-3">
                    <Button variant="primary" size="sm" onClick={handleUpdate}>Save Changes</Button>
                    <Button variant="light" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h4 className="mb-0 text-dark">{activeUser?.name || 'User Name'}</h4>
                    {activeUser?.role && (
                      <Badge bg={activeUser.role === 'admin' ? 'danger' : activeUser.role === 'manager' ? 'info' : 'success'} className="rounded-pill fs-12 px-2.5 py-1 text-capitalize text-white">
                        {activeUser.role}
                      </Badge>
                    )}
                  </div>
                  <p className="fs-14 mb-0 text-primary fw-medium">{activeUser?.designation || 'Set designation'}</p>
                  <p className="text-muted mt-2 mb-0" style={{ fontSize: '14px' }}>{activeUser?.bio || 'No bio added yet.'}</p>
                </>
              )}
            </div>
            {canEdit && !isEditing && (
              <div className="ms-auto align-self-start">
                <Dropdown>
                  <DropdownToggle as={'a'} role="button" className="arrow-none p-1">
                    <IconifyIcon icon="bx:dots-vertical-rounded" className="fs-20 text-dark" />
                  </DropdownToggle>
                  <DropdownMenu className="dropdown-menu-end">
                    <DropdownItem onClick={() => setIsEditing(true)}>
                      <IconifyIcon icon="bx:edit-alt" className="me-2" />
                      Edit Profile
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="mt-3">
              <div className="mb-4">
                <h5 className="text-dark fw-bold mb-2 fs-14 text-uppercase">Skills :</h5>
                <div className="d-flex gap-2 flex-wrap">
                  {Array.isArray(activeUser?.skills) && activeUser.skills.length > 0 ? (
                    activeUser.skills.map((skill: string, idx: number) => (
                      <span key={idx} className="badge bg-primary-subtle text-primary border border-primary-subtle py-1 px-2 fs-12">{skill}</span>
                    ))
                  ) : activeUser?.skills && typeof activeUser.skills === 'string' ? (
                    activeUser.skills.split(',').map((skill: string, idx: number) => (
                      <span key={idx} className="badge bg-primary-subtle text-primary border border-primary-subtle py-1 px-2 fs-12">{skill.trim()}</span>
                    ))
                  ) : (
                    <span className="text-muted fs-13 italic">No skills added yet</span>
                  )}
                </div>
              </div>
              
              <div className="pt-2 border-top">
                <p className="mb-1 text-muted fs-14"><strong>Email:</strong> {activeUser?.email}</p>
                <p className="mb-1 text-muted fs-14"><strong>Phone:</strong> {activeUser?.phone || 'Not Provided'}</p>
                <p className="mb-0 text-muted fs-14">
                  <strong>Website:</strong>{' '}
                  <a href={COMPANY.websiteUrl} target="_blank" rel="noreferrer" className="text-primary text-decoration-underline">
                    {COMPANY.website}
                  </a>
                </p>
              </div>

              {isSelf && (
                <div className="mt-3">
                  <Button variant="outline-danger" size="sm" onClick={() => setShowPasswordModal(true)}>
                    <IconifyIcon icon="bx:key" className="me-1" />
                    Change Password
                  </Button>
                </div>
              )}

              {isAdmin && !isSelf && (
                <div className="mt-3">
                  <Button variant="outline-warning" size="sm" onClick={handleAdminResetPassword}>
                    <IconifyIcon icon="bx:key" className="me-1" />
                    Reset Employee Password
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardBody>
      <CardFooter className="bg-light-subtle py-3">
        <Row className="g-2">
          <Col lg={isElevated ? 6 : 12}>
            <a href={`mailto:${activeUser?.email || COMPANY.supportEmail}`} className="btn btn-primary d-flex align-items-center justify-content-center gap-1 w-100 shadow-sm">
              <IconifyIcon icon="iconamoon:email-duotone" />
              {isElevated ? 'Email' : 'Email Support'}
            </a>
          </Col>
          {isElevated && (
             <Col lg={6}>
             <Link to="/pages/clients" className="btn btn-outline-light d-flex align-items-center justify-content-center gap-1 w-100 shadow-sm">
               <IconifyIcon icon="bx:buildings" />
               Clients CRM
             </Link>
           </Col>
          )}
        </Row>
      </CardFooter>
      {/* --- CHANGE PASSWORD MODAL --- */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold fs-16 text-dark">
            <IconifyIcon icon="bx:lock-open-alt" className="me-1.5 text-danger fs-18" />
            Change Password
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePasswordChange}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted text-uppercase">Current Password</Form.Label>
              <Form.Control 
                type="password" required 
                value={passwordForm.currentPassword} 
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted text-uppercase">New Password</Form.Label>
              <Form.Control 
                type="password" required 
                value={passwordForm.newPassword} 
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted text-uppercase">Confirm New Password</Form.Label>
              <Form.Control 
                type="password" required 
                value={passwordForm.confirmPassword} 
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="light" size="sm" className="fw-bold px-3 rounded-pill" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" size="sm" className="fw-bold px-4 rounded-pill shadow-sm">
              Update Password
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </Card>
  )
}

export default AboutCard
