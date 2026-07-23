import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient'
import api from '@/helpers/api'

interface ActivityNotification {
  _id: string
  userName: string
  action: string
  details?: string
  createdAt: string
}

const NotificationItem = ({ from, content }: { from: string; content: string }) => {
  return (
    <DropdownItem className="py-3 border-bottom text-wrap">
      <div className="d-flex">
        <div className="flex-shrink-0">
          <div className="avatar-sm me-2">
            <span className="avatar-title bg-soft-info text-info fs-20 rounded-circle">{from.charAt(0).toUpperCase()}</span>
          </div>
        </div>
        <div className="flex-grow-1">
          <p className="mb-0 fw-semibold">{from}</p>
          <p className="mb-0 text-wrap">{content}</p>
        </div>
      </div>
    </DropdownItem>
  )
}

const Notifications = () => {
  const [notificationList, setNotificationList] = useState<ActivityNotification[]>([])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/erp/activity-logs')
        setNotificationList((res.data || []).slice(0, 8))
      } catch {
        setNotificationList([])
      }
    }
    fetchNotifications()
  }, [])

  return (
    <Dropdown className="topbar-item" align={'end'}>
      <DropdownToggle as="button" className="content-none topbar-button position-relative" aria-haspopup="true">
        <IconifyIcon icon="iconamoon:notification-duotone" className="fs-24 align-middle" />
        {notificationList.length > 0 && (
          <span className="position-absolute topbar-badge fs-10 translate-middle badge bg-danger rounded-pill">
            {notificationList.length}
            <span className="visually-hidden">recent activity</span>
          </span>
        )}
      </DropdownToggle>
      <DropdownMenu className="py-0 dropdown-lg">
        <div className="p-3 border-top-0 border-start-0 border-end-0 border-dashed border">
          <Row className="align-items-center">
            <Col>
              <h6 className="m-0 fs-16 fw-semibold">Recent Activity</h6>
            </Col>
          </Row>
        </div>
        <SimplebarReactClient style={{ maxHeight: 280 }}>
          {notificationList.length > 0 ? (
            notificationList.map((notification) => (
              <NotificationItem
                key={notification._id}
                from={notification.userName}
                content={notification.details || notification.action}
              />
            ))
          ) : (
            <DropdownItem className="py-4 text-center text-muted">No recent activity</DropdownItem>
          )}
        </SimplebarReactClient>
        <div className="text-center py-3">
          <Link to="/pages/activity-logs" className="btn btn-primary btn-sm icons-center">
            View Audit Trail
            <IconifyIcon icon="bx:right-arrow-alt" className="ms-2" />
          </Link>
        </div>
      </DropdownMenu>
    </Dropdown>
  )
}

export default Notifications
