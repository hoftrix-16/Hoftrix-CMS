import { Col, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import { useAuthContext } from '@/context/useAuthContext'
import AboutCard from './components/AboutCard'
import LeaveRequestCard from './components/LeaveRequestCard'
import TimeTrackerCard from './components/TimeTrackerCard'

const Profile = () => {
  const { user } = useAuthContext()
  const showLeaveCard = user?.role === 'employee' || user?.role === 'admin'

  return (
    <>
      <PageBreadcrumb subName="Pages" title="Profile" />
      <PageMetaData title="Profile" />

      <Row className="mb-4">
        <Col xs={12}>
          <AboutCard />
        </Col>
      </Row>

      {showLeaveCard && (
        <Row className="mb-4">
          <Col xs={12}>
            <LeaveRequestCard />
          </Col>
        </Row>
      )}

      <Row>
        <Col xs={12}>
          <TimeTrackerCard />
        </Col>
      </Row>
    </>
  )
}

export default Profile
