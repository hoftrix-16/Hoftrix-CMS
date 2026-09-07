import type { ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardHeader, CardTitle, Spinner } from 'react-bootstrap'
import { useFinanceDashboard } from '@/hooks/useFinanceDashboard'

const RevenueSources = () => {
  const { data, loading } = useFinanceDashboard()
  const categories = data?.revenueByCategory ?? []

  const chartOptions: ApexOptions = {
    chart: { type: 'donut', height: 320 },
    labels: categories.map((item) => item.name),
    legend: { position: 'bottom' },
    colors: ['#7f56da', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#06b6d4'],
  }

  const series = categories.map((item) => item.amount)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Sources</CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="text-center py-5">
            <Spinner size="sm" />
          </div>
        ) : categories.length === 0 ? (
          <p className="text-muted text-center mb-0">No revenue data available</p>
        ) : (
          <ReactApexChart options={chartOptions} series={series} height={320} type="donut" className="apex-charts" />
        )}
      </CardBody>
    </Card>
  )
}

export default RevenueSources
