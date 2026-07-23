export type FinanceDashboardData = {
  stats: {
    totalIncome: number
    totalExpense: number
    profit: number
    pendingAmount: number
  }
  chart: {
    labels: string[]
    income: number[]
    expense: number[]
  }
  revenueByCategory: { name: string; amount: number }[]
  transactions: {
    id: string
    name: string
    description: string
    amount: number
    date: string
    status: string
  }[]
}

export type SalesDashboardData = {
  stats: {
    totalLeads: number
    closedDeals: number
    totalClients: number
    paidRevenue: number
  }
  pipeline: { status: string; count: number }[]
  chart: { labels: string[]; leads: number[] }
  recentInvoices: {
    id: string
    invoiceNumber: string
    clientName: string
    amount: number
    status: string
    date: string
  }[]
  topClients: { name: string; amount: number }[]
}

export type AnalyticsDashboardData = {
  totalProjects: number
  activeProjects: number
  pendingInvoices: number
  totalRevenue: number
  totalLeads?: number
  activeClients?: number
  monthlyRevenue?: number
  projectsByStatus: { status: string; count: number }[]
  leadPipeline: { status: string; count: number }[]
  recentActivity: {
    _id: string
    userName: string
    action: string
    details?: string
    type: string
    createdAt: string
  }[]
  upcomingDeadlines?: {
    id: string
    title: string
    deadline: string
    status: string
    progress?: number
  }[]
  upcomingFollowUps?: {
    id: string
    clientId: string
    companyName: string
    title: string
    dueDate?: string
  }[]
}
