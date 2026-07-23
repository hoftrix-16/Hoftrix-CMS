import { lazy, Suspense } from 'react'
import FallbackLoading from '@/components/FallbackLoading'
import Footer from '@/components/layout/Footer'
import type { ChildrenType } from '@/types/component-props'
import Preloader from '@/components/Preloader'
import { useLayoutContext } from '@/context/useLayoutContext'

const TopNavigationBar = lazy(() => import('@/components/layout/TopNavigationBar'))
const VerticalNavigationBar = lazy(() => import('@/components/layout/VerticalNavigationBar'))

const AdminLayout = ({ children }: ChildrenType) => {
  const { closeMobileSidebar } = useLayoutContext()

  return (
    <div className="wrapper">
      <button
        type="button"
        className="sidebar-backdrop"
        aria-label="Close navigation menu"
        onClick={closeMobileSidebar}
      />

      <Suspense fallback={<FallbackLoading />}>
        <TopNavigationBar />
      </Suspense>

      <Suspense fallback={<FallbackLoading />}>
        <VerticalNavigationBar />
      </Suspense>

      <div className="page-content">
        <div className="container-xxl">
          <Suspense fallback={<Preloader />}>{children}</Suspense>
        </div>

        <Footer />
      </div>
    </div>
  )
}

export default AdminLayout
