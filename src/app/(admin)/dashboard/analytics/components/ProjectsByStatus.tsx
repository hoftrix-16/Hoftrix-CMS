import type { ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardHeader, CardTitle, Spinner } from 'react-bootstrap'
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard'

const ProjectsByStatus = () => {
  const { data, loading } = useAnalyticsDashboard()
  const projectsByStatus = data?.projectsByStatus ?? []

  const chartOptions: ApexOptions = {
    chart: { type: 'bar', height: 320, toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
    xaxis: { categories: projectsByStatus.map((item) => item.status) },
    colors: ['#7f56da'],
  }

  const series = [{ name: 'Projects', data: projectsByStatus.map((item) => item.count) }]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects by Status</CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="text-center py-5">
            <Spinner size="sm" />
          </div>
        ) : (
          <ReactApexChart options={chartOptions} series={series} height={320} type="bar" className="apex-charts" />
        )}
      </CardBody>
    </Card>
  )
}

export default ProjectsByStatus
