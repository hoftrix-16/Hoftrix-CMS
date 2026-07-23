import { Link } from 'react-router-dom'
import { Dropdown, DropdownDivider, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useAuthContext } from '@/context/useAuthContext'
import { resolveAvatar, handleAvatarError } from '@/helpers/avatar'

const ProfileDropdown = () => {
  const { user, removeSession } = useAuthContext()

  return (
    <Dropdown className="topbar-item" align={'end'}>
      <DropdownToggle
        as="button"
        type="button"
        className="topbar-button content-none"
        id="page-header-user-dropdown"
        data-bs-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false">
        <span className="d-flex align-items-center">
          <img
            className="rounded-circle object-fit-cover"
            width={32}
            height={32}
            src={resolveAvatar(user?.avatar, user?.name || 'User')}
            onError={handleAvatarError}
            alt="avatar"
          />
        </span>
      </DropdownToggle>
      <DropdownMenu>
        <DropdownHeader as="h6">Welcome {user?.name || user?.username}!</DropdownHeader>
        <DropdownItem as={Link} to="/pages/profile">
          <IconifyIcon icon="bx:user-circle" className="text-muted fs-18 align-middle me-1" />
          <span className="align-middle">Profile</span>
        </DropdownItem>
        <DropdownItem as={Link} to="/pages/clients">
          <IconifyIcon icon="bx:buildings" className="text-muted fs-18 align-middle me-1" />
          <span className="align-middle">Clients</span>
        </DropdownItem>
        <DropdownItem as={Link} to="/pages/pricing">
          <IconifyIcon icon="bx:wallet" className="text-muted fs-18 align-middle me-1" />
          <span className="align-middle">Services</span>
        </DropdownItem>
        <DropdownItem as={Link} to="/pages/calendar">
          <IconifyIcon icon="bx:calendar" className="text-muted fs-18 align-middle me-1" />
          <span className="align-middle">Calendar</span>
        </DropdownItem>
        <DropdownDivider className="dropdown-divider my-1" />
        <DropdownItem as="button" className="text-danger dropdown-item" onClick={removeSession}>
          <IconifyIcon icon="bx:log-out" className="fs-18 align-middle me-1" />
          <span className="align-middle">Logout</span>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}

export default ProfileDropdown
