import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import useLocalStorage from '@/hooks/useLocalStorage'
import useQueryParams from '@/hooks/useQueryParams'
import type { ChildrenType } from '@/types/component-props'
import type { LayoutState, LayoutType, MenuType, LayoutOffcanvasStatesType, ThemeType } from '@/types/context'
import { toggleDocumentAttribute } from '@/utils/layout'

const ThemeContext = createContext<LayoutType | undefined>(undefined)

const MOBILE_MAX = 767
const TABLET_MAX = 1199

const useLayoutContext = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useLayoutContext can only be used within LayoutProvider')
  }
  return context
}

const syncMenuSizeAttribute = (size: MenuType['size']) => {
  toggleDocumentAttribute('data-menu-size', size)
}

const setSidebarOpen = (open: boolean) => {
  const html = document.documentElement
  if (open) {
    html.classList.add('sidebar-enable')
    html.classList.add('sidebar-backdrop-visible')
    document.body.style.overflow = 'hidden'
  } else {
    html.classList.remove('sidebar-enable')
    html.classList.remove('sidebar-backdrop-visible')
    document.body.style.overflow = ''
  }
}

const LayoutProvider = ({ children }: ChildrenType) => {
  const queryParams = useQueryParams()
  const override = !!(queryParams.layout_theme || queryParams.topbar_theme || queryParams.menu_theme || queryParams.menu_size)

  const INIT_STATE: LayoutState = {
    theme: 'dark',
    topbarTheme: 'dark',
    menu: {
      theme: 'dark',
      size: 'default',
    },
  }

  const [settings, setSettings] = useLocalStorage<LayoutState>('__HOFTRIX_ERP_CONFIG__', INIT_STATE, override)
  const [offcanvasStates, setOffcanvasStates] = useState<LayoutOffcanvasStatesType>({
    showThemeCustomizer: false,
    showActivityStream: false,
    showBackdrop: false,
  })
  const [tabletExpanded, setTabletExpanded] = useState(false)

  const applyViewportMenu = useCallback((width: number, expandedTablet: boolean) => {
    if (width <= MOBILE_MAX) {
      syncMenuSizeAttribute('hidden')
      return
    }
    setSidebarOpen(false)
    if (width <= TABLET_MAX) {
      syncMenuSizeAttribute(expandedTablet ? 'default' : 'condensed')
      return
    }
    syncMenuSizeAttribute('default')
  }, [])

  const closeMobileSidebar = useCallback(() => {
    setSidebarOpen(false)
    setOffcanvasStates((prev) => ({ ...prev, showBackdrop: false }))
  }, [])

  const openMobileSidebar = useCallback(() => {
    if (window.innerWidth > MOBILE_MAX) return
    setSidebarOpen(true)
    setOffcanvasStates((prev) => ({ ...prev, showBackdrop: true }))
  }, [])

  const toggleMobileSidebar = useCallback(() => {
    const width = window.innerWidth
    if (width <= MOBILE_MAX) {
      const html = document.documentElement
      const willOpen = !html.classList.contains('sidebar-enable')
      setSidebarOpen(willOpen)
      setOffcanvasStates((prev) => ({ ...prev, showBackdrop: willOpen }))
      return
    }
    if (width <= TABLET_MAX) {
      setTabletExpanded((prev) => {
        const next = !prev
        syncMenuSizeAttribute(next ? 'default' : 'condensed')
        return next
      })
      return
    }
    // Desktop: toggle condensed for extra workspace
    const current = document.documentElement.getAttribute('data-menu-size')
    const nextSize = current === 'condensed' ? 'default' : 'condensed'
    syncMenuSizeAttribute(nextSize as MenuType['size'])
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width > MOBILE_MAX) {
        closeMobileSidebar()
      }
      if (width > TABLET_MAX) {
        setTabletExpanded(false)
      }
      applyViewportMenu(width, tabletExpanded)
    }

    const handleOutsideClick = (e: MouseEvent) => {
      if (window.innerWidth > MOBILE_MAX) return
      const html = document.documentElement
      if (!html.classList.contains('sidebar-enable')) return
      const target = e.target as HTMLElement
      if (target.closest('.main-nav') || target.closest('.button-toggle-menu')) return
      closeMobileSidebar()
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    document.addEventListener('click', handleOutsideClick)

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('click', handleOutsideClick)
      document.body.style.overflow = ''
    }
  }, [applyViewportMenu, closeMobileSidebar, tabletExpanded])

  const updateSettings = (_newSettings: Partial<LayoutState>) => setSettings({ ...settings, ..._newSettings })
  const changeTheme = (newTheme: ThemeType) => updateSettings({ theme: newTheme })
  const changeTopbarTheme = (newTheme: ThemeType) => updateSettings({ topbarTheme: newTheme })
  const changeMenuTheme = (newTheme: MenuType['theme']) => updateSettings({ menu: { ...settings.menu, theme: newTheme } })
  const changeMenuSize = (_newSize: MenuType['size']) => updateSettings({ menu: { ...settings.menu, size: 'default' } })

  const toggleBackdrop = useCallback(() => {
    toggleMobileSidebar()
  }, [toggleMobileSidebar])

  const toggleActivityStream = useCallback(() => {
    setOffcanvasStates((prev) => ({
      ...prev,
      showActivityStream: !prev.showActivityStream,
    }))
  }, [])

  // Force dark SaaS theme (overrides old cached light settings)
  useEffect(() => {
    if (settings.menu.theme !== 'dark' || settings.theme !== 'dark' || settings.topbarTheme !== 'dark') {
      updateSettings({
        theme: 'dark',
        topbarTheme: 'dark',
        menu: { ...settings.menu, theme: 'dark' },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    toggleDocumentAttribute('data-bs-theme', settings.theme)
    toggleDocumentAttribute('data-topbar-color', settings.topbarTheme)
    toggleDocumentAttribute('data-menu-color', settings.menu.theme)
    applyViewportMenu(window.innerWidth, tabletExpanded)
  }, [settings, applyViewportMenu, tabletExpanded])

  return (
    <ThemeContext.Provider
      value={useMemo(
        () => ({
          ...settings,
          themeMode: settings.theme,
          changeTheme,
          changeTopbarTheme,
          changeMenu: {
            theme: changeMenuTheme,
            size: changeMenuSize,
          },
          themeCustomizer: {
            open: false,
            toggle: () => {},
          },
          activityStream: {
            open: offcanvasStates.showActivityStream,
            toggle: toggleActivityStream,
          },
          toggleBackdrop,
          toggleMobileSidebar,
          closeMobileSidebar,
          openMobileSidebar,
          resetSettings: () => updateSettings(INIT_STATE),
        }),
        [
          settings,
          offcanvasStates.showActivityStream,
          toggleActivityStream,
          toggleBackdrop,
          toggleMobileSidebar,
          closeMobileSidebar,
          openMobileSidebar,
        ],
      )}>
      {children}
    </ThemeContext.Provider>
  )
}

export { LayoutProvider, useLayoutContext }
