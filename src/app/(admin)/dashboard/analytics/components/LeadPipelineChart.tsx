import type { ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardHeader, CardTitle, Spinner } from 'react-bootstrap'
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard'

const LeadPipelineChart = () => {
  const { data, loading } = useAnalyticsDashboard()
  const leadPipeline = data?.leadPipeline ?? []

  const chartOptions: ApexOptions = {
    chart: { type: 'donut', height: 320 },
    labels: leadPipeline.map((item) => item.status),
    legend: { position: 'bottom' },
    colors: ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444'],
  }

  const series = leadPipeline.map((item) => item.count)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Pipeline</CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="text-center py-5">
            <Spinner size="sm" />
          </div>
        ) : (
          <ReactApexChart options={chartOptions} series={series} height={320} type="donut" className="apex-charts" />
        )}
      </CardBody>
    </Card>
  )
}

export default LeadPipelineChart
