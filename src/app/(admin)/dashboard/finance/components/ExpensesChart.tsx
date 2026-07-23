import type { ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardHeader, CardTitle, Spinner } from 'react-bootstrap'
import { useFinanceDashboard } from '@/hooks/useFinanceDashboard'

const ExpensesChart = () => {
  const { data, loading } = useFinanceDashboard()

  const chartOptions: ApexOptions = {
    chart: { type: 'bar', height: 280, toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
    xaxis: { categories: data?.chart.labels ?? [] },
    colors: ['#ef4444', '#7f56da'],
    legend: { show: true },
  }

  const series = [
    { name: 'Expenses', data: data?.chart.expense ?? [] },
    { name: 'Income', data: data?.chart.income ?? [] },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Cash Flow</CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="text-center py-5">
            <Spinner size="sm" />
          </div>
        ) : (
          <ReactApexChart options={chartOptions} series={series} height={280} type="bar" className="apex-charts" />
        )}
      </CardBody>
    </Card>
  )
}

export default ExpensesChart
