import { Card, CardBody, CardHeader, CardTitle, Spinner, Table } from 'react-bootstrap'
import { currency } from '@/context/constants'
import { useSalesDashboard } from '@/hooks/useSalesDashboard'

const Accounts = () => {
  const { data, loading } = useSalesDashboard()
  const topClients = data?.topClients ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Clients by Revenue</CardTitle>
      </CardHeader>
      <CardBody className="pb-1">
        {loading ? (
          <div className="text-center py-4">
            <Spinner size="sm" />
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead>
                <tr>
                  <th>Client</th>
                  <th className="text-end">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topClients.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-center text-muted py-4">
                      No paid client revenue yet
                    </td>
                  </tr>
                ) : (
                  topClients.map((client) => (
                    <tr key={client.name}>
                      <td>{client.name}</td>
                      <td className="text-end">
                        {currency}
                        {client.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default Accounts
