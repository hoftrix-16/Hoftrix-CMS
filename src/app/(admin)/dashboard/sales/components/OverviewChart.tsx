import type { ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardHeader, CardTitle, Spinner } from 'react-bootstrap'
import { useSalesDashboard } from '@/hooks/useSalesDashboard'

const OverviewChart = () => {
  const { data, loading } = useSalesDashboard()

  const chartOptions: ApexOptions = {
    chart: { height: 320, type: 'area', toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.45, opacityTo: 0.05 },
    },
    xaxis: { categories: data?.chart.labels ?? [] },
    colors: ['#7f56da'],
  }

  const series = [{ name: 'New Leads', data: data?.chart.leads ?? [] }]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Acquisition Trend</CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="text-center py-5">
            <Spinner size="sm" />
          </div>
        ) : (
          <ReactApexChart options={chartOptions} series={series} height={320} type="area" className="apex-charts" />
        )}
      </CardBody>
    </Card>
  )
}

export default OverviewChart
