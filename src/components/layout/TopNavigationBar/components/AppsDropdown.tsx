import { Link } from 'react-router-dom'
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

const CRM_QUICK_APPS = [
  { name: 'Clients', path: '/pages/clients', icon: 'iconamoon:profile-circle-duotone' },
  { name: 'Leads', path: '/pages/leads-kanban', icon: 'iconamoon:trend-up-duotone' },
  { name: 'Invoices', path: '/pages/invoices', icon: 'iconamoon:invoice-duotone' },
  { name: 'Projects', path: '/pages/projects', icon: 'iconamoon:briefcase-duotone' },
  { name: 'Calendar', path: '/pages/calendar', icon: 'iconamoon:calendar-1-duotone' },
  { name: 'Follow Ups', path: '/pages/follow-ups', icon: 'iconamoon:clock-duotone' },
]

const AppsDropdown = () => {
  return (
    <Dropdown className="topbar-item d-none d-lg-flex" align="end">
      <DropdownToggle as="button" className="topbar-button content-none" aria-haspopup="true">
        <IconifyIcon icon="iconamoon:apps" className="fs-24 align-middle" />
      </DropdownToggle>
      <DropdownMenu className="p-0">
        <div className="p-1">
          {CRM_QUICK_APPS.map((app) => (
            <DropdownItem key={app.path} as={Link} to={app.path} className="py-2 d-flex align-items-center gap-2">
              <IconifyIcon icon={app.icon} className="fs-20 text-primary" />
              <span>{app.name}</span>
            </DropdownItem>
          ))}
        </div>
      </DropdownMenu>
    </Dropdown>
  )
}

export default AppsDropdown
