import { currentYear } from '@/context/constants'
import { COMPANY } from '@/config/app'
import { Col, Container, Row } from 'react-bootstrap'

const Footer = () => {
  return (
    <footer className="footer">
      <Container fluid>
        <Row>
          <Col xs={12} className="text-center">
            <span className="icons-center">
              {currentYear} © {COMPANY.legalName}. All Rights Reserved.
            </span>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default Footer
