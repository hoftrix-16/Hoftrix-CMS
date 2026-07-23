import { lazy, Suspense } from 'react'

import ActivityStreamToggle from './components/ActivityStreamToggle'
import LeftSideBarToggle from './components/LeftSideBarToggle'
import ProfileDropdown from './components/ProfileDropdown'
import SearchBox from './components/SearchBox'

const AppsDropdown = lazy(() => import('./components/AppsDropdown'))
const Notifications = lazy(() => import('./components/Notifications'))

const TopNavigationBar = () => {
  return (
    <header className="topbar">
      <div className="container-xxl position-relative">
        <div className="navbar-header">
          <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
            <LeftSideBarToggle />
            <SearchBox />
          </div>
          <div className="d-flex align-items-center gap-1 topbar-actions">
            <div className="d-none d-sm-block">
              <Suspense fallback={null}>
                <AppsDropdown />
              </Suspense>
            </div>

            <Suspense fallback={null}>
              <Notifications />
            </Suspense>

            <div className="d-none d-sm-block">
              <ActivityStreamToggle />
            </div>

            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopNavigationBar
