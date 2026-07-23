import { lazy } from 'react'
import { Navigate, type RouteProps } from 'react-router-dom'

const Analytics = lazy(() => import('@/app/(admin)/dashboard/analytics/page'))
const Finance = lazy(() => import('@/app/(admin)/dashboard/finance/page'))
const Sales = lazy(() => import('@/app/(admin)/dashboard/sales/page'))

const Clients = lazy(() => import('@/app/(admin)/pages/clients/page'))
const ClientDetail = lazy(() => import('@/app/(admin)/pages/clients/detail/page'))
const AddClient = lazy(() => import('@/app/(admin)/pages/add-client/page'))
const Invoices = lazy(() => import('@/app/(admin)/pages/invoices/page'))
const InvoiceBuilder = lazy(() => import('@/app/(admin)/pages/invoices/builder/page'))
const InvoiceView = lazy(() => import('@/app/(admin)/pages/invoices/view/page'))
const InvoiceSettings = lazy(() => import('@/app/(admin)/pages/invoices/settings/page'))
const Employees = lazy(() => import('@/app/(admin)/pages/employees/page'))
const Pricing = lazy(() => import('@/app/(admin)/pages/pricing/page'))
const Profile = lazy(() => import('@/app/(admin)/pages/profile/page'))
const BalanceSheet = lazy(() => import('@/app/(admin)/pages/balance-sheet/page'))
const Projects = lazy(() => import('@/app/(admin)/pages/projects/page'))
const ProjectTasks = lazy(() => import('@/app/(admin)/pages/project-tasks/page'))
const AddEmployee = lazy(() => import('@/app/(admin)/pages/add-employee/page'))
const EditEmployee = lazy(() => import('@/app/(admin)/pages/edit-employee/page'))
const EmployeeProfile = lazy(() => import('@/app/(admin)/pages/employee-profile/page'))
const Calendar = lazy(() => import('@/app/(admin)/pages/calendar/page'))
const LeadsKanban = lazy(() => import('@/app/(admin)/pages/leads-kanban/page'))
const Deals = lazy(() => import('@/app/(admin)/pages/deals/page'))
const FollowUps = lazy(() => import('@/app/(admin)/pages/follow-ups/page'))
const ActivityLogs = lazy(() => import('@/app/(admin)/pages/activity-logs/page'))
const Permissions = lazy(() => import('@/app/(admin)/pages/permissions/page'))
const Payments = lazy(() => import('@/app/(admin)/pages/payments/page'))
const Expenses = lazy(() => import('@/app/(admin)/pages/expenses/page'))
const Proposals = lazy(() => import('@/app/(admin)/pages/proposals/page'))
const Contracts = lazy(() => import('@/app/(admin)/pages/contracts/page'))

const NotFound = lazy(() => import('@/app/(admin)/not-found'))
const AuthSignIn = lazy(() => import('@/app/(other)/auth/sign-in/page'))
const AuthResetPass = lazy(() => import('@/app/(other)/auth/reset-pass/page'))
const AuthNewPassword = lazy(() => import('@/app/(other)/auth/new-password/page'))

export type RoutesProps = {
  path: RouteProps['path']
  name: string
  element: RouteProps['element']
  exact?: boolean
}

const initialRoutes: RoutesProps[] = [
  { path: '/', name: 'root', element: <Navigate to="/dashboard/analytics" /> },
  { path: '*', name: 'not-found', element: <NotFound /> },
]

const generalRoutes: RoutesProps[] = [
  { path: '/dashboard/analytics', name: 'Dashboard', element: <Analytics /> },
  { path: '/dashboard/finance', name: 'Finance', element: <Finance /> },
  { path: '/dashboard/sales', name: 'Sales', element: <Sales /> },
]

const appsRoutes: RoutesProps[] = [
  { path: '/apps/contacts', name: 'Contacts Redirect', element: <Navigate to="/pages/clients" replace /> },
  { path: '/apps/chat', name: 'Chat Redirect', element: <Navigate to="/pages/clients" replace /> },
  { path: '/apps/email', name: 'Email Redirect', element: <Navigate to="/dashboard/analytics" replace /> },
]

const customRoutes: RoutesProps[] = [
  { path: '/pages/clients', name: 'Clients', element: <Clients /> },
  { path: '/pages/clients/:id', name: 'Client Detail', element: <ClientDetail /> },
  { path: '/pages/add-client', name: 'Add Client', element: <AddClient /> },
  { path: '/pages/invoices', name: 'Invoices', element: <Invoices /> },
  { path: '/pages/invoices/new', name: 'New Invoice', element: <InvoiceBuilder /> },
  { path: '/pages/invoices/settings', name: 'Invoice Branding', element: <InvoiceSettings /> },
  { path: '/pages/invoices/:id/edit', name: 'Edit Invoice', element: <InvoiceBuilder /> },
  { path: '/pages/invoices/:id', name: 'View Invoice', element: <InvoiceView /> },
  { path: '/pages/payments', name: 'Payments', element: <Payments /> },
  { path: '/pages/expenses', name: 'Expenses', element: <Expenses /> },
  { path: '/pages/employees', name: 'Employees', element: <Employees /> },
  { path: '/pages/pricing', name: 'Services', element: <Pricing /> },
  { path: '/pages/proposals', name: 'Proposals', element: <Proposals /> },
  { path: '/pages/contracts', name: 'Contracts', element: <Contracts /> },
  { path: '/pages/profile', name: 'Profile', element: <Profile /> },
  { path: '/pages/balance-sheet', name: 'Balance Sheet', element: <BalanceSheet /> },
  { path: '/pages/projects', name: 'Projects', element: <Projects /> },
  { path: '/pages/project-tasks', name: 'Project Tasks', element: <ProjectTasks /> },
  { path: '/pages/add-employee', name: 'Add Employee', element: <AddEmployee /> },
  { path: '/pages/edit-employee/:id', name: 'Edit Employee', element: <EditEmployee /> },
  { path: '/pages/employee-profile/:id', name: 'Employee Profile', element: <EmployeeProfile /> },
  { path: '/pages/calendar', name: 'Calendar', element: <Calendar /> },
  { path: '/pages/leads-kanban', name: 'Leads', element: <LeadsKanban /> },
  { path: '/pages/deals', name: 'Deals Pipeline', element: <Deals /> },
  { path: '/pages/follow-ups', name: 'Follow Ups', element: <FollowUps /> },
  { path: '/pages/activity-logs', name: 'Activities', element: <ActivityLogs /> },
  { path: '/pages/permissions', name: 'Roles & Permissions', element: <Permissions /> },
]

export const authRoutes: RoutesProps[] = [
  { path: '/auth/sign-in', name: 'Sign In', element: <AuthSignIn /> },
  { path: '/auth/reset-pass', name: 'Reset Password', element: <AuthResetPass /> },
  { path: '/auth/new-password', name: 'New Password', element: <AuthNewPassword /> },
]

export const appRoutes = [...initialRoutes, ...generalRoutes, ...appsRoutes, ...customRoutes, ...authRoutes]
