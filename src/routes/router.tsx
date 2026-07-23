import { Navigate, Route, Routes, type RouteProps } from 'react-router-dom'

import AuthLayout from '@/layouts/AuthLayout'
import { useAuthContext } from '@/context/useAuthContext'
import { appRoutes, authRoutes } from '@/routes/index'
import AdminLayout from '@/layouts/AdminLayout'
import { getMenuItems, getMenuItemFromURL } from '@/helpers/menu'

const ProtectedRoute = ({ route, children }: { route: any; children: React.ReactNode }) => {
  const { user } = useAuthContext()
  
  if (user && user.role !== 'admin') {
    // 1. Always allow profile, fallback, root, sign-in, etc.
    const alwaysAllowedPaths = ['/', '*', '/auth/sign-in', '/auth/reset-pass', '/auth/new-password', '/pages/profile', '/pages/profile/']
    if (alwaysAllowedPaths.includes(route.path)) {
      return <>{children}</>
    }

    // 2. Allow subroutes that have dynamic parameters if the parent listing key is permitted
    let matchingKey = ''
    if (route.path.startsWith('/pages/edit-employee/') || route.path.startsWith('/pages/employee-profile/')) {
      matchingKey = 'mgmt-employees'
    } else if (route.path.startsWith('/pages/add-employee')) {
      matchingKey = 'mgmt-add-employee'
    } else if (route.path.startsWith('/pages/add-client') || route.path.startsWith('/pages/clients')) {
      matchingKey = 'mgmt-clients'
    } else if (route.path.startsWith('/pages/deals')) {
      matchingKey = 'mgmt-deals'
    } else if (route.path.startsWith('/pages/follow-ups')) {
      matchingKey = 'mgmt-followups'
    } else if (route.path.startsWith('/pages/proposals')) {
      matchingKey = 'mgmt-proposals'
    } else if (route.path.startsWith('/pages/contracts')) {
      matchingKey = 'mgmt-contracts'
    } else if (route.path.startsWith('/pages/payments')) {
      matchingKey = 'mgmt-payments'
    } else if (route.path.startsWith('/pages/expenses')) {
      matchingKey = 'mgmt-expenses'
    } else if (route.path.startsWith('/pages/project-tasks') || route.path.includes('status=completed')) {
      matchingKey = 'mgmt-projects'
    }

    // 3. Match using the standard menu helper
    if (!matchingKey) {
      const allMenuItems = getMenuItems()
      const match = getMenuItemFromURL(allMenuItems, route.path)
      if (match) {
        matchingKey = match.key
      }
    }

    if (matchingKey) {
      const allowedKeys = user.permissions || []
      
      const hasPermission =
        allowedKeys.includes(matchingKey) ||
        (allowedKeys.includes('mgmt-employees') &&
          (matchingKey.startsWith('mgmt-employees') ||
            matchingKey === 'mgmt-employees-list' ||
            matchingKey === 'mgmt-add-employee')) ||
        (allowedKeys.includes('mgmt-clients') &&
          (matchingKey.startsWith('mgmt-clients') ||
            matchingKey === 'mgmt-clients-list' ||
            matchingKey === 'mgmt-add-client')) ||
        (allowedKeys.includes('mgmt-projects') &&
          (matchingKey === 'mgmt-projects-completed' || matchingKey === 'mgmt-project-tasks')) ||
        (allowedKeys.includes('mgmt-kanban') && matchingKey === 'mgmt-deals') ||
        (allowedKeys.includes('mgmt-balance-sheet') &&
          (matchingKey === 'mgmt-payments' || matchingKey === 'mgmt-expenses')) ||
        (allowedKeys.includes('dashboards') &&
          (matchingKey === 'dashboard-analytics' ||
            matchingKey === 'dashboard-finance' ||
            matchingKey === 'dashboard-sales' ||
            matchingKey === 'dashboards'))

      if (!hasPermission) {
        return <Navigate to="/pages/profile" replace />
      }
    }
  }

  return <>{children}</>
}

const AppRouter = (props: RouteProps) => {
  const { isAuthenticated } = useAuthContext()

  return (
    <Routes>
      {(authRoutes || []).map((route, idx) => (
        <Route key={idx + route.name} path={route.path} element={<AuthLayout {...props}>{route.element}</AuthLayout>} />
      ))}

      {(appRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated ? (
              <ProtectedRoute route={route}>
                <AdminLayout {...props}>{route.element}</AdminLayout>
              </ProtectedRoute>
            ) : (
              <Navigate
                to={{
                  pathname: '/auth/sign-in',
                  search: 'redirectTo=' + route.path,
                }}
              />
            )
          }
        />
      ))}
    </Routes>
  )
}

export default AppRouter
