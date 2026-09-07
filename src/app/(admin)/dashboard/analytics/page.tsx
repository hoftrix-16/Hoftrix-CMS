import { Col, Row } from 'react-bootstrap'

import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import Stats, { UpcomingPanel } from './components/Stats'
import ProjectsByStatus from './components/ProjectsByStatus'
import LeadPipelineChart from './components/LeadPipelineChart'
import RecentActivityFeed from './components/RecentActivityFeed'

export default function Home() {
  return (
    <>
      <PageBreadcrumb title="Dashboard" subName="CRM" />
      <PageMetaData title="CRM Dashboard" />

      <Row>
        <Col xxl={3}>
          <Stats />
        </Col>
        <Col xxl={9}>
          <ProjectsByStatus />
        </Col>
      </Row>
      <Row>
        <Col lg={4}>
          <LeadPipelineChart />
        </Col>
        <Col lg={8}>
          <RecentActivityFeed />
        </Col>
      </Row>
      <UpcomingPanel />
    </>
  )
}
