import { Card, CardBody, CardHeader, CardTitle, Spinner, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useSalesDashboard } from '@/hooks/useSalesDashboard'

const Transactions = () => {
  const { data, loading } = useSalesDashboard()
  const pipeline = data?.pipeline ?? []

  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle>Pipeline Summary</CardTitle>
        <Link to="/pages/leads-kanban" className="btn btn-light btn-sm">
          Open Kanban
        </Link>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="text-center py-4">
            <Spinner size="sm" />
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th className="text-end">Leads</th>
                </tr>
              </thead>
              <tbody>
                {pipeline.map((item) => (
                  <tr key={item.status}>
                    <td>{item.status}</td>
                    <td className="text-end fw-semibold">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default Transactions
