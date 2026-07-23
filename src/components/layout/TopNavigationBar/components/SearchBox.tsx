import { useState } from 'react'
import { Collapse } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

const SearchBox = () => {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <form className="app-search d-none d-md-block me-auto">
        <div className="position-relative">
          <input type="search" className="form-control" placeholder="Search..." autoComplete="off" />
          <IconifyIcon icon="iconamoon:search-duotone" className="search-widget-icon" />
        </div>
      </form>

      <div className="topbar-item d-md-none">
        <button
          type="button"
          className="topbar-button btn p-0 border-0"
          aria-label="Toggle search"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <IconifyIcon icon="iconamoon:search-duotone" className="fs-22 text-muted" />
        </button>
      </div>

      <Collapse in={mobileOpen} className="d-md-none w-100 position-absolute start-0 top-100 px-3 pb-2 mobile-search-collapse">
        <div>
          <form className="app-search mobile-app-search" onSubmit={(e) => e.preventDefault()}>
            <div className="position-relative">
              <input
                type="search"
                className="form-control"
                placeholder="Search CRM..."
                autoComplete="off"
                autoFocus={mobileOpen}
              />
              <IconifyIcon icon="iconamoon:search-duotone" className="search-widget-icon" />
            </div>
          </form>
        </div>
      </Collapse>
    </>
  )
}

export default SearchBox
