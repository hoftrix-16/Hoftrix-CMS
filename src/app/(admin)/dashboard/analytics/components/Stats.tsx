'use client'
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard'
import { Card, Col, Row, Spinner, Badge, ListGroup } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

const Stats = () => {
  const { data, loading } = useAnalyticsDashboard()

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner size="sm" />
      </div>
    )
  }

  const statItems = [
    { label: 'Total Leads', value: data?.totalLeads ?? 0, icon: 'bx:user-plus', color: 'primary' },
    { label: 'Active Clients', value: data?.activeClients ?? 0, icon: 'bx:buildings', color: 'success' },
    { label: 'Running Projects', value: data?.activeProjects ?? 0, icon: 'bx:briefcase', color: 'warning' },
    { label: 'Monthly Revenue', value: `₹${(data?.monthlyRevenue ?? 0).toLocaleString()}`, icon: 'bx:rupee', color: 'info' },
  ]

  return (
    <Row>
      {statItems.map((item, idx) => (
        <Col md={6} xxl={12} key={idx} className="mb-3">
          <Card className="border-0">
            <Card.Body className="d-flex align-items-center">
              <div className={`avatar-md bg-soft-${item.color} text-${item.color} rounded-circle d-flex align-items-center justify-content-center me-3`}>
                <IconifyIcon icon={item.icon} className="fs-24" />
              </div>
              <div>
                <p className="text-muted small mb-1 fw-bold text-uppercase">{item.label}</p>
                <h4 className="fw-bold mb-0">{item.value}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export const UpcomingPanel = () => {
  const { data, loading } = useAnalyticsDashboard()
  if (loading) return null

  return (
    <Row className="g-3 mt-1">
      <Col lg={6}>
        <Card className="border-0 h-100">
          <Card.Header className="border-0 pb-0">
            <h5 className="fw-bold mb-0">Upcoming Follow-ups</h5>
          </Card.Header>
          <Card.Body>
            {(data?.upcomingFollowUps || []).length === 0 ? (
              <div className="crm-empty py-4">
                <p className="mb-0">No pending follow-ups</p>
              </div>
            ) : (
              <ListGroup variant="flush">
                {(data?.upcomingFollowUps || []).map((item: any) => (
                  <ListGroup.Item key={String(item.id)} className="bg-transparent px-0 d-flex justify-content-between align-items-start">
                    <div>
                      <Link to={`/pages/clients/${item.clientId}`} className="fw-bold text-decoration-none">{item.title}</Link>
                      <div className="text-muted small">{item.companyName}</div>
                    </div>
                    <Badge bg="soft-warning" className="text-warning">
                      {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}
                    </Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
            <div className="mt-3">
              <Link to="/pages/follow-ups" className="small fw-bold text-primary">View all follow-ups →</Link>
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col lg={6}>
        <Card className="border-0 h-100">
          <Card.Header className="border-0 pb-0">
            <h5 className="fw-bold mb-0">Upcoming Deadlines</h5>
          </Card.Header>
          <Card.Body>
            {(data?.upcomingDeadlines || []).length === 0 ? (
              <div className="crm-empty py-4">
                <p className="mb-0">No upcoming project deadlines</p>
              </div>
            ) : (
              <ListGroup variant="flush">
                {(data?.upcomingDeadlines || []).map((item: any) => (
                  <ListGroup.Item key={String(item.id)} className="bg-transparent px-0 d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold">{item.title}</div>
                      <div className="text-muted small">{item.status} · {item.progress || 0}%</div>
                    </div>
                    <Badge bg="soft-danger" className="text-danger">
                      {item.deadline ? new Date(item.deadline).toLocaleDateString() : '—'}
                    </Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
            <div className="mt-3">
              <Link to="/pages/projects" className="small fw-bold text-primary">View projects →</Link>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}

export default Stats
