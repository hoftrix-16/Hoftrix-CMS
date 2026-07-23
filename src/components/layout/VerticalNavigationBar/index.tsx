import { lazy, Suspense } from 'react'

import FallbackLoading from '@/components/FallbackLoading'
import LogoBox from '@/components/LogoBox'
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient'
import { getMenuItems } from '@/helpers/menu'
import HoverMenuToggle from './components/HoverMenuToggle'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

import { useAuthContext } from '@/context/useAuthContext'
import { useLayoutContext } from '@/context/useLayoutContext'

const AppMenu = lazy(() => import('./components/AppMenu'))

const VerticalNavigationBar = () => {
  const { user } = useAuthContext()
  const { closeMobileSidebar } = useLayoutContext()
  let menuItems = getMenuItems()

  // Dynamic Permission-based filtering for non-admins
  if (user && user.role !== 'admin') {
    const allowedKeys = [...(user.permissions || [])]
    // Always allow profile and basic apps access
    if (!allowedKeys.includes('page-profile')) allowedKeys.push('page-profile')
    if (!allowedKeys.includes('mgmt-calendar')) allowedKeys.push('mgmt-calendar')

    const filterMenuItems = (items: any[], keys: string[], parentAllowed = false): any[] => {
      return items
        .map((item) => {
          if (item.isTitle) {
            return { ...item }
          }
          const isAllowed = keys.includes(item.key) || parentAllowed || (item.parentKey && keys.includes(item.parentKey))
          if (item.children) {
            const visibleChildren = filterMenuItems(item.children, keys, isAllowed)
            if (visibleChildren.length > 0) {
              return { ...item, children: visibleChildren }
            }
            if (isAllowed) {
              return { ...item, children: [] }
            }
            return null
          }
          if (isAllowed) {
            return { ...item }
          }
          return null
        })
        .filter((item) => item !== null)
        .filter((item, idx, arr) => {
          if (item.isTitle) {
            const nextItem = arr[idx + 1]
            if (!nextItem || nextItem.isTitle) {
              return false
            }
          }
          return true
        })
    }

    menuItems = filterMenuItems(menuItems, allowedKeys)
  }

  return (
    <div className="main-nav" id="leftside-menu-container">
      <div className="d-flex align-items-center justify-content-between pe-3">
        <LogoBox containerClassName="logo-box flex-grow-1" textLogo={{ className: 'logo-lg', height: 28 }} />
        <button
          className="btn btn-sm btn-icon btn-light rounded-circle d-md-none shadow-sm d-flex align-items-center justify-content-center sidebar-close-btn"
          onClick={closeMobileSidebar}
          style={{ width: 36, height: 36, zIndex: 1060, minWidth: 36 }}
          title="Close Sidebar"
          type="button"
          aria-label="Close navigation menu"
        >
          <IconifyIcon icon="bx:x" className="fs-18 text-muted" />
        </button>
      </div>

      <HoverMenuToggle />

      <SimplebarReactClient className="scrollbar">
        <Suspense fallback={<FallbackLoading />}>
          <AppMenu menuItems={menuItems} />
        </Suspense>
      </SimplebarReactClient>
    </div>
  )
}

export default VerticalNavigationBar
