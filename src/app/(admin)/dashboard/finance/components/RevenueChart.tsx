import type { ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardHeader, CardTitle, Spinner } from 'react-bootstrap'
import { useFinanceDashboard } from '@/hooks/useFinanceDashboard'

const RevenueChart = () => {
  const { data, loading } = useFinanceDashboard()

  const chartOptions: ApexOptions = {
    chart: { height: 280, type: 'line', toolbar: { show: false } },
    stroke: { dashArray: [0, 8], width: [2, 2], curve: 'smooth' },
    fill: {
      opacity: [1, 1],
      type: ['gradient', 'solid'],
      gradient: { type: 'vertical', opacityFrom: 0.5, opacityTo: 0, stops: [0, 70] },
    },
    xaxis: {
      categories: data?.chart.labels ?? [],
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
    yaxis: {
      min: 0,
      labels: {
        formatter: (val) => `${val}`,
      },
    },
    legend: { show: true },
    colors: ['#7f56da', '#22c55e'],
    tooltip: { shared: true },
  }

  const series = [
    { name: 'Income', type: 'area', data: data?.chart.income ?? [] },
    { name: 'Expenses', type: 'line', data: data?.chart.expense ?? [] },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs Expenses</CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="text-center py-5">
            <Spinner size="sm" />
          </div>
        ) : (
          <ReactApexChart options={chartOptions} series={series} height={280} type="line" className="apex-charts" />
        )}
      </CardBody>
    </Card>
  )
}

export default RevenueChart
