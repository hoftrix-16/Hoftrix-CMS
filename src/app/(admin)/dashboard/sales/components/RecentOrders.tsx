import { Card, CardBody, CardTitle, Spinner, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { currency } from '@/context/constants'
import { useSalesDashboard } from '@/hooks/useSalesDashboard'

const RecentOrders = () => {
  const { data, loading } = useSalesDashboard()
  const invoices = data?.recentInvoices ?? []

  return (
    <Card>
      <CardBody>
        <div className="d-flex align-items-center justify-content-between">
          <CardTitle>Recent Invoices</CardTitle>
          <Link to="/pages/invoices" className="btn btn-primary btn-sm">
            View All
          </Link>
        </div>
      </CardBody>
      <div className="table-responsive">
        {loading ? (
          <div className="text-center py-4">
            <Spinner size="sm" />
          </div>
        ) : (
          <Table className="mb-0">
            <thead className="bg-light bg-opacity-50">
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No invoices yet
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.clientName}</td>
                    <td>
                      {currency}
                      {invoice.amount.toLocaleString()}
                    </td>
                    <td>{invoice.status}</td>
                    <td>{new Date(invoice.date).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </div>
    </Card>
  )
}

export default RecentOrders
