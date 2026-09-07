import type { ChildrenType } from '@/types/component-props'
import { Suspense, useEffect } from 'react'
import Footer from '@/components/layout/Footer'
import TopNavigationBar from '@/components/layout/TopNavigationBar'
import VerticalNavigationBar from '@/components/layout/VerticalNavigationBar'
import { useLayoutContext } from '@/context/useLayoutContext'

/** Lightweight page-area fallback — avoids full-screen loader flash */
const PageFallback = () => (
  <div className="hoftrix-page-fallback" role="status" aria-label="Loading page">
    <div className="hoftrix-page-fallback-bar" />
  </div>
)

const AdminLayout = ({ children }: ChildrenType) => {
  const { closeMobileSidebar } = useLayoutContext()

  // Prefetch common first screens so navigation feels instant
  useEffect(() => {
    void import('@/app/(admin)/dashboard/analytics/page')
    void import('@/app/(admin)/pages/clients/page')
  }, [])

  return (
    <div className="wrapper">
      <button
        type="button"
        className="sidebar-backdrop"
        aria-label="Close navigation menu"
        onClick={closeMobileSidebar}
      />

      <TopNavigationBar />
      <VerticalNavigationBar />

      <div className="page-content">
        <div className="container-xxl">
          <Suspense fallback={<PageFallback />}>{children}</Suspense>
        </div>
        <Footer />
      </div>
    </div>
  )
}

export default AdminLayout
