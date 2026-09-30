import clsx from 'clsx'
import { Fragment, useCallback, useEffect, useState, type MouseEvent } from 'react'
import { Collapse } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useLayoutContext } from '@/context/useLayoutContext'
import { findAllParent, findMenuItem, getMenuItemFromURL } from '@/helpers/menu'
import type { MenuItemType, SubMenus } from '@/types/menu'

/* -------------------------------------------------------
   Normalize URL
------------------------------------------------------- */
const normalizePath = (path: string = '') => {
  const cleanPath = path.split('?')[0].split('#')[0]

  if (cleanPath === '/') {
    return '/'
  }

  return cleanPath.replace(/\/+$/, '')
}

/* -------------------------------------------------------
   Menu Item With Children
------------------------------------------------------- */
const MenuItemWithChildren = ({
  item,
  className,
  linkClassName,
  subMenuClassName,
  activeMenuItems,
  toggleMenu,
}: SubMenus) => {
  const [open, setOpen] = useState<boolean>(
    activeMenuItems?.includes(item.key) ?? false
  )

  useEffect(() => {
    setOpen(activeMenuItems?.includes(item.key) ?? false)
  }, [activeMenuItems, item.key])

  const toggleMenuItem = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault()

    const status = !open

    setOpen(status)

    if (toggleMenu) {
      toggleMenu(item, status)
    }
  }

  const getActiveClass = useCallback(
    (menuItem: MenuItemType) => {
      return activeMenuItems?.includes(menuItem.key) ? 'active' : ''
    },
    [activeMenuItems],
  )

  return (
    <li className={className}>
      <div
        onClick={toggleMenuItem}
        aria-expanded={open}
        role="button"
        className={clsx(linkClassName)}
      >
        {item.icon && (
          <span className="nav-icon">
            <IconifyIcon icon={item.icon} />
          </span>
        )}

        <span className="nav-text">{item.label}</span>

        {!item.badge ? (
          <IconifyIcon
            icon="bx:chevron-down"
            className="menu-arrow"
          />
        ) : (
          <span
            className={`badge badge-pill text-end bg-${item.badge.variant}`}
          >
            {item.badge.text}
          </span>
        )}
      </div>

      <Collapse in={open}>
        <div>
          <ul className={clsx(subMenuClassName)}>
            {(item.children || []).map((child, idx) => (
              <Fragment key={`${child.key}-${idx}`}>
                {child.children ? (
                  <MenuItemWithChildren
                    item={child}
                    linkClassName={clsx(
                      'nav-link',
                      getActiveClass(child),
                    )}
                    activeMenuItems={activeMenuItems}
                    className="sub-nav-item"
                    subMenuClassName="nav sub-navbar-nav"
                    toggleMenu={toggleMenu}
                  />
                ) : (
                  <MenuItem
                    item={child}
                    className="sub-nav-item"
                    linkClassName={clsx(
                      'sub-nav-link',
                      getActiveClass(child),
                    )}
                  />
                )}
              </Fragment>
            ))}
          </ul>
        </div>
      </Collapse>
    </li>
  )
}

/* -------------------------------------------------------
   Normal Menu Item
------------------------------------------------------- */
const MenuItem = ({
  item,
  className,
  linkClassName,
}: SubMenus) => {
  return (
    <li className={className}>
      <MenuItemLink
        item={item}
        className={linkClassName}
      />
    </li>
  )
}

/* -------------------------------------------------------
   Menu Link
------------------------------------------------------- */
const MenuItemLink = ({
  item,
  className,
}: SubMenus) => {
  const { closeMobileSidebar } = useLayoutContext()

  return (
    <Link
      to={item.url ?? ''}
      target={item.target}
      className={clsx(className, {
        disabled: item.isDisabled,
      })}
      onClick={() => {
        if (window.innerWidth <= 767) {
          closeMobileSidebar()
        }
      }}
    >
      {item.icon && (
        <span className="nav-icon">
          <IconifyIcon icon={item.icon} />
        </span>
      )}

      <span className="nav-text">
        {item.label}
      </span>

      {item.badge && (
        <span
          className={`badge badge-pill text-end bg-${item.badge.variant}`}
        >
          {item.badge.text}
        </span>
      )}
    </Link>
  )
}

/* -------------------------------------------------------
   App Menu Props
------------------------------------------------------- */
type AppMenuProps = {
  menuItems: Array<MenuItemType>
}

/* -------------------------------------------------------
   App Menu
------------------------------------------------------- */
const AppMenu = ({
  menuItems,
}: AppMenuProps) => {
  const { pathname } = useLocation()
  const { closeMobileSidebar } = useLayoutContext()

  const [activeMenuItems, setActiveMenuItems] =
    useState<Array<string>>([])

  /* -----------------------------------------------------
     Toggle Parent Menu
  ----------------------------------------------------- */
  const toggleMenu = (
    menuItem: MenuItemType,
    show: boolean,
  ) => {
    if (show) {
      setActiveMenuItems([
        menuItem.key,
        ...findAllParent(menuItems, menuItem),
      ])
    } else {
      setActiveMenuItems((prev) =>
        prev.filter(
          (key) =>
            key !== menuItem.key &&
            !findAllParent(menuItems, menuItem).includes(key),
        ),
      )
    }
  }

  /* -----------------------------------------------------
     Mobile Sidebar
  ----------------------------------------------------- */
  useEffect(() => {
    if (window.innerWidth <= 767) {
      closeMobileSidebar()
    }
  }, [pathname, closeMobileSidebar])

  /* -----------------------------------------------------
     Active Class
  ----------------------------------------------------- */
  const getActiveClass = useCallback(
    (item: MenuItemType) => {
      return activeMenuItems.includes(item.key)
        ? 'active'
        : ''
    },
    [activeMenuItems],
  )

  /* -----------------------------------------------------
     Find Active Menu
  ----------------------------------------------------- */
  const activeMenu = useCallback(() => {
    const currentPath = normalizePath(pathname)

    if (!currentPath) {
      setActiveMenuItems([])
      return
    }

    /*
      First use your existing helper.
    */
    const matchingMenuItem = getMenuItemFromURL(
      menuItems,
      currentPath,
    )

    if (!matchingMenuItem) {
      setActiveMenuItems([])
      return
    }

    const activeItem = findMenuItem(
      menuItems,
      matchingMenuItem.key,
    )

    if (!activeItem) {
      setActiveMenuItems([])
      return
    }

    /*
      Current item + all parents
    */
    const activeItems = [
      activeItem.key,
      ...findAllParent(menuItems, activeItem),
    ]

    setActiveMenuItems(activeItems)

    /* ---------------------------------------------------
       Scroll active menu item into view
    --------------------------------------------------- */
    setTimeout(() => {
      const links = Array.from(
        document.querySelectorAll<HTMLAnchorElement>(
          '#leftside-menu-container .simplebar-content a[href]',
        ),
      )

      const activatedItem = links.find((link) => {
        const linkPath = normalizePath(
          new URL(link.href, window.location.origin).pathname,
        )

        return linkPath === currentPath
      })

      if (!activatedItem) {
        return
      }

      const simplebarContent =
        document.querySelector<HTMLElement>(
          '#leftside-menu-container .simplebar-content-wrapper',
        )

      if (!simplebarContent) {
        return
      }

      const offset =
        activatedItem.offsetTop -
        window.innerHeight * 0.4

      scrollToElement(
        simplebarContent,
        offset,
        600,
      )
    }, 300)
  }, [pathname, menuItems])

  /* -----------------------------------------------------
     Smooth Scroll
  ----------------------------------------------------- */
  const scrollToElement = (
    element: HTMLElement,
    to: number,
    duration: number,
  ) => {
    const start = element.scrollTop
    const change = to - start
    const increment = 20

    let currentTime = 0

    const easeInOutQuad = (
      t: number,
      b: number,
      c: number,
      d: number,
    ) => {
      t /= d / 2

      if (t < 1) {
        return (c / 2) * t * t + b
      }

      t--

      return (
        (-c / 2) *
          (t * (t - 2) - 1) +
        b
      )
    }

    const animateScroll = () => {
      currentTime += increment

      const value = easeInOutQuad(
        currentTime,
        start,
        change,
        duration,
      )

      element.scrollTop = value

      if (currentTime < duration) {
        setTimeout(
          animateScroll,
          increment,
        )
      }
    }

    animateScroll()
  }

  /* -----------------------------------------------------
     Run active menu whenever route changes
  ----------------------------------------------------- */
  useEffect(() => {
    if (menuItems?.length > 0) {
      activeMenu()
    }
  }, [activeMenu, menuItems])

  /* -----------------------------------------------------
     Render
  ----------------------------------------------------- */
  return (
    <ul className="navbar-nav">
      {(menuItems || []).map(
        (item, idx) => (
          <Fragment
            key={`${item.key}-${idx}`}
          >
            {item.isTitle ? (
              <li className="menu-title">
                {item.label}
              </li>
            ) : (
              <>
                {item.children ? (
                  <MenuItemWithChildren
                    item={item}
                    toggleMenu={toggleMenu}
                    className="nav-item"
                    linkClassName={clsx(
                      'nav-link',
                      getActiveClass(item),
                    )}
                    subMenuClassName="nav sub-navbar-nav"
                    activeMenuItems={
                      activeMenuItems
                    }
                  />
                ) : (
                  <MenuItem
                    item={item}
                    linkClassName={clsx(
                      'nav-link',
                      getActiveClass(item),
                    )}
                    className="nav-item"
                  />
                )}
              </>
            )}
          </Fragment>
        ),
      )}
    </ul>
  )
}

export default AppMenu