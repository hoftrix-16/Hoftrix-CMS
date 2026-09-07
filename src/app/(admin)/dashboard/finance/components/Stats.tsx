import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardBody, Spinner } from 'react-bootstrap'
import { currency } from '@/context/constants'
import { useFinanceDashboard } from '@/hooks/useFinanceDashboard'

const Stats = () => {
  const { data, loading } = useFinanceDashboard()

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner size="sm" />
      </div>
    )
  }

  const stats = [
    { name: 'Total Income', amount: data?.stats.totalIncome ?? 0, icon: 'bx:trending-up', iconColor: 'success' },
    { name: 'Total Expense', amount: data?.stats.totalExpense ?? 0, icon: 'bx:trending-down', iconColor: 'danger' },
    { name: 'Net Profit', amount: data?.stats.profit ?? 0, icon: 'bx:wallet', iconColor: 'primary' },
    { name: 'Pending Invoices', amount: data?.stats.pendingAmount ?? 0, icon: 'bx:time-five', iconColor: 'warning' },
  ]

  return (
    <div className="crm-stat-grid">
      {stats.map((stat, idx) => (
        <Card key={idx} className="h-100">
          <CardBody>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h3 className="mb-0 fw-bold mb-2">
                  {currency}
                  {stat.amount.toLocaleString()}
                </h3>
                <p className="text-muted mb-0">{stat.name}</p>
              </div>
              <div className="avatar-lg d-inline-block">
                <span className={`avatar-title bg-${stat.iconColor}-subtle text-${stat.iconColor} rounded-circle`}>
                  <IconifyIcon icon={stat.icon} className="fs-32" />
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

export default Stats
