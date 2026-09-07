import { useEffect, useState } from 'react'
import { Card, Col, Row, Button, Badge, Form, Spinner } from 'react-bootstrap'
import httpClient from '@/helpers/httpClient'
import { resolveAvatar, handleAvatarError } from '@/helpers/avatar'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

interface User {
  _id: string
  name: string
  email: string
  role: string
  permissions: string[]
  avatar?: string
  designation?: string
}

const PERMISSION_GROUPS = [
  {
    title: 'Dashboards',
    description: 'Analytics and KPI overview',
    icon: 'iconamoon:home-duotone',
    permissions: [
      { key: 'dashboards', label: 'Analytics Dashboard', desc: 'Access business analytics and key performance metrics.' }
    ]
  },
  {
    title: 'CRM',
    description: 'Leads, clients, deals, and follow-ups',
    icon: 'iconamoon:profile-circle-duotone',
    permissions: [
      { key: 'mgmt-kanban', label: 'Leads Pipeline', desc: 'Access sales leads and kanban stages.' },
      { key: 'mgmt-clients', label: 'Clients', desc: 'View and manage client accounts and detail pages.' },
      { key: 'mgmt-deals', label: 'Deals Pipeline', desc: 'Access the deals pipeline board and stage moves.' },
      { key: 'mgmt-followups', label: 'Follow Ups', desc: 'View and complete client follow-up reminders.' },
      { key: 'mgmt-activity-logs', label: 'Activities / Audit Trail', desc: 'Access system activity history and audit logs.' }
    ]
  },
  {
    title: 'Projects & Delivery',
    description: 'Projects, tasks, and delivery calendar',
    icon: 'iconamoon:briefcase-duotone',
    permissions: [
      { key: 'mgmt-projects', label: 'Projects', desc: 'View and update client projects and budgets.' },
      { key: 'mgmt-calendar', label: 'Calendar', desc: 'Access deadlines, leave, and invoice due dates.' }
    ]
  },
  {
    title: 'Finance',
    description: 'Invoices, payments, expenses, and balance sheet',
    icon: 'iconamoon:invoice-duotone',
    permissions: [
      { key: 'mgmt-invoices', label: 'Invoices', desc: 'Create and track customer invoices.' },
      { key: 'mgmt-balance-sheet', label: 'Balance Sheet & Finance', desc: 'Access balance sheet, income, and expense records.' }
    ]
  },
  {
    title: 'Marketing',
    description: 'Services, proposals, and contracts',
    icon: 'iconamoon:file-document-duotone',
    permissions: [
      { key: 'mgmt-services', label: 'Services Catalog', desc: 'View service rates and catalog items.' },
      { key: 'mgmt-proposals', label: 'Proposals', desc: 'Create and manage client proposals.' },
      { key: 'mgmt-contracts', label: 'Contracts', desc: 'Create and manage client contracts.' }
    ]
  },
  {
    title: 'Team',
    description: 'Staff directory access',
    icon: 'iconamoon:profile-duotone',
    permissions: [
      { key: 'mgmt-employees', label: 'Employees', desc: 'View employee directory and staff profiles. Leave, payroll, and deactivation remain admin-only.' }
    ]
  }
]

const PagePermissions = () => {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchUsers = async (selectFirst = false) => {
    try {
      setLoading(true)
      const res = await httpClient.get('/auth/users')
      const fetchedUsers = res.data || []
      setUsers(fetchedUsers)
      
      if (fetchedUsers.length > 0) {
        if (selectFirst) {
          handleSelectUser(fetchedUsers[0])
        } else if (selectedUser) {
          const updatedSelected = fetchedUsers.find((u: User) => u._id === selectedUser._id)
          if (updatedSelected) {
            handleSelectUser(updatedSelected)
          }
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load users list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(true)
  }, [])

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setSelectedPermissions(user.permissions || [])
  }

  const handleTogglePermission = (key: string) => {
    if (selectedUser?.role === 'admin') return // Admins have static full permissions
    
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    )
  }

  const handleSelectAll = () => {
    if (selectedUser?.role === 'admin') return
    const allKeys = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key))
    setSelectedPermissions(allKeys)
  }

  const handleClearAll = () => {
    if (selectedUser?.role === 'admin') return
    setSelectedPermissions([])
  }

  const handleSaveChanges = async () => {
    if (!selectedUser) return
    
    setSaving(true)
    try {
      await httpClient.put(`/auth/users/${selectedUser._id}/permissions`, {
        permissions: selectedPermissions
      })
      
      toast.success(`Access permissions updated successfully for ${selectedUser.name}!`)
      await fetchUsers()
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Failed to save changes'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase()
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    )
  })

  return (
    <div className="p-4">
      {/* Page Header */}
      <Row className="align-items-center mb-4">
        <Col>
          <h3 className="fw-bold text-dark text-uppercase m-0">Page Access Permissions</h3>
          <p className="text-muted small mb-0">Define which screens, tabs, and administrative actions each employee can access.</p>
        </Col>
      </Row>

      <Row>
        {/* Left Side: Users list */}
        <Col lg={4} className="mb-4 mb-lg-0">
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-transparent border-0 pt-4 pb-2 px-3">
              <h5 className="fw-bold text-dark mb-3">System Accounts</h5>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="Search user or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-pill bg-light border-0 px-4 py-2 text-muted fs-13"
                />
                <IconifyIcon 
                  icon="bx:search" 
                  className="position-absolute end-0 top-50 translate-middle-y me-3 text-muted" 
                  style={{ pointerEvents: 'none' }}
                />
              </div>
            </Card.Header>

            <Card.Body className="px-2 pt-2 scrollbar" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" size="sm" />
                  <p className="text-muted small mt-2">Fetching users...</p>
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isSelected = selectedUser?._id === user._id
                  const permCount = user.role === 'admin' ? 'ALL' : (user.permissions || []).length
                  
                  return (
                    <div
                      key={user._id}
                      onClick={() => handleSelectUser(user)}
                      className={`d-flex align-items-center gap-3 p-3 rounded-4 mb-2 transition-all ${
                        isSelected ? 'perm-user-active' : 'perm-user-item'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <img
                        src={resolveAvatar(user.avatar, user.name)}
                        alt={user.name}
                        onError={handleAvatarError}
                        className="rounded-circle border border-2 p-0.5"
                        style={{
                          width: '42px',
                          height: '42px',
                          objectFit: 'cover',
                          borderColor: isSelected ? 'rgba(255, 77, 0, 0.45)' : 'rgba(255,255,255,0.08)',
                        }}
                      />
                      <div className="flex-grow-1 min-w-0">
                        <h6 className="fw-bold mb-0 text-truncate" style={{ color: isSelected ? '#FF4D00' : '#F3F4F6' }}>
                          {user.name}
                        </h6>
                        <p className="small mb-0 text-truncate" style={{ color: isSelected ? 'rgba(255,255,255,0.85)' : '#9CA3AF' }}>
                          {user.email}
                        </p>
                        <div className="d-flex align-items-center gap-1.5 mt-1.5">
                          <Badge 
                            bg={user.role === 'admin' ? 'danger' : user.role === 'client' ? 'info' : 'success'} 
                            className="rounded-pill px-2 py-0.5 fs-10"
                          >
                            {user.role}
                          </Badge>
                          {user.designation && (
                            <span className="small fs-10 text-truncate" style={{ maxWidth: '100px', color: '#9CA3AF' }}>
                              • {user.designation}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-end">
                        <Badge
                          className="rounded-pill py-1.5 px-2 fs-10 fw-bold"
                          style={
                            isSelected
                              ? { background: '#FF4D00', color: '#fff' }
                              : { background: 'rgba(255,255,255,0.08)', color: '#D1D5DB' }
                          }
                        >
                          {permCount} {user.role !== 'admin' ? 'Perms' : ''}
                        </Badge>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-5 text-muted">
                  <IconifyIcon icon="iconamoon:profile-circle-duotone" width={48} height={48} className="opacity-25 mb-2" />
                  <p className="small mb-0">No users match search query.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Side: Permissions toggles */}
        <Col lg={8}>
          {selectedUser ? (
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Header className="bg-transparent border-0 pt-4 pb-2 px-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h5 className="fw-bold text-dark m-0">Permissions Matrix</h5>
                    <Badge bg="soft-primary" className="text-primary rounded-pill small">
                      {selectedUser.name}
                    </Badge>
                  </div>
                  <p className="text-muted small m-0">
                    {selectedUser.role === 'admin' 
                      ? 'Admins possess unrestricted full system privileges by default.' 
                      : 'Customize dynamic module access toggles below.'}
                  </p>
                </div>
                
                {selectedUser.role !== 'admin' && (
                  <div className="d-flex gap-2">
                    <Button variant="soft-secondary" size="sm" className="rounded-pill px-3 py-1 fs-11 fw-bold" onClick={handleSelectAll}>
                      Select All
                    </Button>
                    <Button variant="soft-danger" size="sm" className="rounded-pill px-3 py-1 fs-11 fw-bold" onClick={handleClearAll}>
                      Clear All
                    </Button>
                  </div>
                )}
              </Card.Header>

              <Card.Body className="px-4 py-3">
                {selectedUser.role === 'admin' ? (
                  <div className="text-center py-5 my-4 bg-light bg-opacity-25 rounded-4 border border-dashed border-2">
                    <IconifyIcon icon="iconamoon:shield-duotone" className="text-danger mb-3" width={64} height={64} />
                    <h5 className="fw-bold text-danger">Super Admin Privilege</h5>
                    <p className="text-muted small mx-auto" style={{ maxWidth: '400px' }}>
                      This account operates as a Super Admin. They inherently possess full administrative rights over every module, database entity, and client account. No manual permission assignment is required.
                    </p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-4">
                    {PERMISSION_GROUPS.map((group, groupIdx) => (
                      <div key={groupIdx} className="border-bottom pb-4 last-border-none">
                        <div className="d-flex align-items-center gap-2.5 mb-3">
                          <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary d-flex align-items-center justify-content-center">
                            <IconifyIcon icon={group.icon} className="fs-18" />
                          </div>
                          <div>
                            <h6 className="fw-bold text-dark mb-0.5">{group.title}</h6>
                            <p className="text-muted small m-0 fs-11">{group.description}</p>
                          </div>
                        </div>

                        <Row className="g-3">
                          {group.permissions.map((perm) => {
                            const isAllowed = selectedPermissions.includes(perm.key)
                            return (
                              <Col md={6} key={perm.key}>
                                <div 
                                  className={`p-3 rounded-4 border transition-all h-100 d-flex gap-3 align-items-start ${
                                    isAllowed 
                                      ? 'bg-light bg-opacity-25 border-primary border-opacity-30 shadow-sm-light' 
                                      : 'bg-transparent border-light'
                                  }`}
                                  onClick={() => handleTogglePermission(perm.key)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <Form.Check 
                                    type="switch"
                                    id={`perm-switch-${perm.key}`}
                                    checked={isAllowed}
                                    onChange={() => {}} // Controlled click handles it
                                    className="custom-switch mt-0.5"
                                  />
                                  <div>
                                    <Form.Label htmlFor={`perm-switch-${perm.key}`} className="fw-bold text-dark mb-1 fs-13 cursor-pointer">
                                      {perm.label}
                                    </Form.Label>
                                    <p className="text-muted small mb-0" style={{ fontSize: '10.5px', lineHeight: '1.4' }}>
                                      {perm.desc}
                                    </p>
                                  </div>
                                </div>
                              </Col>
                            )
                          })}
                        </Row>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>

              {selectedUser.role !== 'admin' && (
                <Card.Footer className="bg-transparent border-0 px-4 pb-4 pt-2 d-flex justify-content-end">
                  <Button 
                    variant="primary" 
                    className="rounded-pill shadow-sm px-5 py-2 fw-bold d-flex align-items-center gap-2"
                    onClick={handleSaveChanges}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Spinner animation="border" size="sm" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <IconifyIcon icon="bx:save" className="fs-18" />
                        <span>Save Permissions</span>
                      </>
                    )}
                  </Button>
                </Card.Footer>
              )}
            </Card>
          ) : (
            <Card className="border-0 shadow-sm rounded-4 h-100 d-flex align-items-center justify-content-center py-5 text-muted">
              <Card.Body className="text-center py-5">
                <IconifyIcon icon="iconamoon:shield-duotone" width={64} height={64} className="opacity-25 mb-3" />
                <h5 className="fw-bold">No Account Selected</h5>
                <p className="small mb-0">Choose a user account from the directory pane to view and adjust permissions.</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      <style>{`
        .cursor-pointer { cursor: pointer; }
        .hover-bg-light:hover {
          background-color: var(--bs-light);
        }
        .perm-user-item {
          border: 1px solid transparent;
          background: transparent;
        }
        .perm-user-item:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.06);
        }
        .perm-user-active {
          background: rgba(255, 77, 0, 0.12) !important;
          border: 1px solid rgba(255, 77, 0, 0.35) !important;
          box-shadow: inset 3px 0 0 #FF4D00;
        }
        .transition-all {
          transition: all 0.2s ease-in-out;
        }
        .fs-10 { font-size: 10px; }
        .fs-11 { font-size: 11px; }
        .fs-13 { font-size: 13px; }
        .gap-1.5 { gap: 6px; }
        .gap-2.5 { gap: 10px; }
        .last-border-none:last-of-type {
          border-bottom: none !important;
          padding-bottom: 0 !important;
        }
        .custom-switch .form-check-input {
          cursor: pointer;
          width: 2.2em;
          height: 1.1em;
        }
        .shadow-sm-light {
          box-shadow: 0 1px 3px rgba(0, 123, 255, 0.05);
        }
      `}</style>
    </div>
  )
}

export default PagePermissions
