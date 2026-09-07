import { useEffect } from 'react'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useLayoutContext } from '@/context/useLayoutContext'

const HoverMenuToggle = () => {
  const { changeMenu: { size: changeMenuSize } } = useLayoutContext()

  useEffect(() => {
    // Force default size on every render to ensure sticky behavior
    changeMenuSize('default')
  }, [])

  return (
    <div className="button-sm-hover" style={{ cursor: 'default', opacity: 0.5 }}>
      <span className="button-sm-hover-icon">
        <IconifyIcon icon="iconamoon:arrow-left-4-square-duotone" />
      </span>
    </div>
  )
}

export default HoverMenuToggle
