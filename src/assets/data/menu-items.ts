import type { MenuItemType } from '@/types/menu'

export const MENU_ITEMS: MenuItemType[] = [
  {
    key: 'general',
    label: 'GENERAL',
    isTitle: true,
  },
  {
    key: 'dashboards',
    icon: 'iconamoon:home-duotone',
    label: 'Dashboard',
    url: '/dashboard/analytics',
  },
  {
    key: 'crm',
    label: 'CRM',
    isTitle: true,
  },
  {
    key: 'mgmt-kanban',
    icon: 'iconamoon:trend-up-duotone',
    label: 'Leads',
    url: '/pages/leads-kanban',
  },
  {
    key: 'mgmt-clients',
    icon: 'iconamoon:profile-circle-duotone',
    label: 'Clients',
    url: '/pages/clients',
  },
  {
    key: 'mgmt-deals',
    icon: 'iconamoon:certificate-check-duotone',
    label: 'Deals Pipeline',
    url: '/pages/deals',
  },
  {
    key: 'mgmt-followups',
    icon: 'iconamoon:clock-duotone',
    label: 'Follow Ups',
    url: '/pages/follow-ups',
  },
  {
    key: 'mgmt-activity-logs',
    icon: 'iconamoon:history-duotone',
    label: 'Activities',
    url: '/pages/activity-logs',
  },
  {
    key: 'projects-section',
    label: 'PROJECTS',
    isTitle: true,
  },
  {
    key: 'mgmt-projects',
    icon: 'iconamoon:briefcase-duotone',
    label: 'Active Projects',
    url: '/pages/projects?status=active',
  },
  {
    key: 'mgmt-projects-completed',
    icon: 'iconamoon:check-circle-1-duotone',
    label: 'Completed Projects',
    url: '/pages/projects?status=completed',
  },
  {
    key: 'mgmt-project-tasks',
    icon: 'iconamoon:file-check-duotone',
    label: 'Project Tasks',
    url: '/pages/project-tasks',
  },
  {
    key: 'finance-section',
    label: 'FINANCE',
    isTitle: true,
  },
  {
    key: 'mgmt-invoices',
    icon: 'iconamoon:invoice-duotone',
    label: 'Invoices',
    url: '/pages/invoices',
  },
  {
    key: 'mgmt-payments',
    icon: 'iconamoon:credit-card-duotone',
    label: 'Payments',
    url: '/pages/payments',
  },
  {
    key: 'mgmt-expenses',
    icon: 'iconamoon:delivery-duotone',
    label: 'Expenses',
    url: '/pages/expenses',
  },
  {
    key: 'mgmt-balance-sheet',
    icon: 'iconamoon:calculator-duotone',
    label: 'Balance Sheet',
    url: '/pages/balance-sheet',
  },
  {
    key: 'team-section',
    label: 'TEAM MANAGEMENT',
    isTitle: true,
  },
  {
    key: 'mgmt-employees',
    icon: 'iconamoon:profile-duotone',
    label: 'Employees',
    url: '/pages/employees',
  },
  {
    key: 'mgmt-permissions',
    icon: 'iconamoon:shield-yes-duotone',
    label: 'Roles & Permissions',
    url: '/pages/permissions',
  },
  {
    key: 'marketing-section',
    label: 'MARKETING',
    isTitle: true,
  },
  {
    key: 'mgmt-services',
    icon: 'iconamoon:sorting-left-duotone',
    label: 'Services Catalog',
    url: '/pages/pricing',
  },
  {
    key: 'mgmt-proposals',
    icon: 'iconamoon:file-document-duotone',
    label: 'Proposals',
    url: '/pages/proposals',
  },
  {
    key: 'mgmt-contracts',
    icon: 'iconamoon:file-check-duotone',
    label: 'Contracts',
    url: '/pages/contracts',
  },
  {
    key: 'custom',
    label: 'USER SETTINGS',
    isTitle: true,
  },
  {
    key: 'mgmt-calendar',
    icon: 'iconamoon:calendar-2-duotone',
    label: 'Calendar',
    url: '/pages/calendar',
  },
  {
    key: 'page-profile',
    label: 'My Profile',
    icon: 'iconamoon:profile-circle-duotone',
    url: '/pages/profile',
  },
]
