import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardBody, Spinner } from 'react-bootstrap'
import { currency } from '@/context/constants'
import { useSalesDashboard } from '@/hooks/useSalesDashboard'

const Stats = () => {
  const { data, loading } = useSalesDashboard()

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner size="sm" />
      </div>
    )
  }

  const stats = [
    { title: 'Total Leads', amount: data?.stats.totalLeads ?? 0, icon: 'bx:user-voice', iconColor: 'primary' },
    { title: 'Closed Deals', amount: data?.stats.closedDeals ?? 0, icon: 'bx:badge-check', iconColor: 'success' },
    { title: 'Active Clients', amount: data?.stats.totalClients ?? 0, icon: 'bx:group', iconColor: 'info' },
    { title: 'Paid Revenue', amount: data?.stats.paidRevenue ?? 0, icon: 'bx:dollar', iconColor: 'warning' },
  ]

  return (
    <div className="crm-stat-grid">
      {stats.map((stat, idx) => (
        <Card key={idx} className="h-100">
          <CardBody className="overflow-hidden position-relative">
            <IconifyIcon icon={stat.icon} className={`fs-36 text-${stat.iconColor}`} />
            <h3 className="mb-0 fw-bold mt-3 mb-1">
              {idx === 3 ? `${currency}${stat.amount.toLocaleString()}` : stat.amount}
            </h3>
            <p className="text-muted mb-0">{stat.title}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

export default Stats
