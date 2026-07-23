import type { ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardHeader, CardTitle, Spinner, Table } from 'react-bootstrap'
import { useSalesDashboard } from '@/hooks/useSalesDashboard'

const SalesByCategory = () => {
  const { data, loading } = useSalesDashboard()
  const pipeline = data?.pipeline ?? []

  const chartOptions: ApexOptions = {
    chart: { height: 250, type: 'donut' },
    labels: pipeline.map((item) => item.status),
    legend: { show: false },
    colors: ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444'],
  }

  const series = pipeline.map((item) => item.count)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Pipeline</CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="text-center py-4">
            <Spinner size="sm" />
          </div>
        ) : (
          <>
            <ReactApexChart options={chartOptions} series={series} height={250} type="donut" className="apex-charts" />
            <Table size="sm" className="mt-3 mb-0">
              <tbody>
                {pipeline.map((item) => (
                  <tr key={item.status}>
                    <td>{item.status}</td>
                    <td className="text-end fw-semibold">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </CardBody>
    </Card>
  )
}

export default SalesByCategory
