import { Card, CardBody, CardHeader, CardTitle, Spinner, Table } from 'react-bootstrap'
import { currency } from '@/context/constants'
import { useFinanceDashboard } from '@/hooks/useFinanceDashboard'

const Transactions = () => {
  const { data, loading } = useFinanceDashboard()
  const transactions = data?.transactions ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardBody className="p-0">
        {loading ? (
          <div className="text-center py-5">
            <Spinner size="sm" />
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="table-nowrap align-middle mb-0">
              <thead className="bg-light bg-opacity-50">
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      No finance records yet
                    </td>
                  </tr>
                ) : (
                  transactions.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.description}</td>
                      <td className={item.status === 'Dr.' ? 'text-danger' : 'text-success'}>
                        {currency}
                        {item.amount.toLocaleString()}
                      </td>
                      <td>{new Date(item.date).toLocaleDateString()}</td>
                      <td>
                        <span
                          className={`badge ${item.status === 'Dr.' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'} p-1`}>
                          {item.status}
                        </span>
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

export default Transactions
