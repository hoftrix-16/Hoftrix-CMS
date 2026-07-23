import { useEffect, useState } from 'react'

import { Offcanvas, OffcanvasBody, OffcanvasHeader } from 'react-bootstrap'

import api from '@/helpers/api'
import type { OffcanvasControlType } from '@/types/context'
import IconifyIcon from './wrappers/IconifyIcon'
import SimplebarReactClient from './wrappers/SimplebarReactClient'

interface ActivityLogItem {
  _id: string
  userName: string
  action: string
  details?: string
  type: string
  createdAt: string
}

const ActivityLogItemView = ({ item }: { item: ActivityLogItem }) => {
  const variant = item.type === 'danger' ? 'danger' : item.type === 'success' ? 'success' : item.type === 'warning' ? 'warning' : 'info'

  return (
    <div className="position-relative ps-4 mb-4">
      <span
        className={`position-absolute start-0 translate-middle-x d-inline-flex align-items-center justify-content-center rounded-circle text-light fs-20 bg-${variant} avatar-sm`}>
        <IconifyIcon icon="iconamoon:history-duotone" />
      </span>
      <div className="ms-2">
        <h5 className="mb-1 fw-semibold fs-15 lh-base">{item.action}</h5>
        <p className="mb-1 text-muted">{item.details || item.userName}</p>
        <h6 className="mt-1 text-muted fs-12">{new Date(item.createdAt).toLocaleString()}</h6>
      </div>
    </div>
  )
}

const ActivityStream = ({ open, toggle }: OffcanvasControlType) => {
  const [activityList, setActivityList] = useState<ActivityLogItem[]>([])

  useEffect(() => {
    if (!open) return
    const fetchLogs = async () => {
      try {
        const res = await api.get('/erp/activity-logs')
        setActivityList(res.data || [])
      } catch {
        setActivityList([])
      }
    }
    fetchLogs()
  }, [open])

  return (
    <div>
      <Offcanvas
        show={open}
        onHide={toggle}
        placement="end"
        className="border-0"
        tabIndex={-1}
        id="theme-activity-offcanvas"
        style={{ maxWidth: 450, width: '100%' }}>
        <OffcanvasHeader closeVariant="white" closeButton className="d-flex align-items-center bg-primary p-3">
          <h5 className="text-white m-0 fw-semibold">Recent Activity</h5>
        </OffcanvasHeader>
        <OffcanvasBody className="p-0">
          <SimplebarReactClient className="p-4" style={{ maxHeight: '100vh' }}>
            {activityList.length > 0 ? (
              activityList.map((item) => <ActivityLogItemView key={item._id} item={item} />)
            ) : (
              <div className="crm-empty py-5">
                <div className="crm-empty-icon"><IconifyIcon icon="iconamoon:history-duotone" /></div>
                <p className="mb-0">No recent CRM activity yet</p>
              </div>
            )}
          </SimplebarReactClient>
        </OffcanvasBody>
      </Offcanvas>
    </div>
  )
}

export default ActivityStream
