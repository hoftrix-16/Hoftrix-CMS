import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useLayoutContext } from '@/context/useLayoutContext'

const LeftSideBarToggle = () => {
  const { toggleMobileSidebar } = useLayoutContext()

  return (
    <div className="topbar-item">
      <button
        type="button"
        className="button-toggle-menu btn p-0 border-0"
        onClick={toggleMobileSidebar}
        aria-label="Toggle navigation menu"
      >
        <IconifyIcon icon="iconamoon:menu-burger-horizontal" className="fs-22 text-muted" />
      </button>
    </div>
  )
}

export default LeftSideBarToggle
