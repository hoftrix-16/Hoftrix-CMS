import { Card, CardBody, CardHeader, CardTitle, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard'

const RecentActivityFeed = () => {
  const { data, loading } = useAnalyticsDashboard()
  const activity = data?.recentActivity ?? []

  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle>Recent Activity</CardTitle>
        <Link to="/pages/activity-logs" className="btn btn-light btn-sm">
          View All
        </Link>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="text-center py-4">
            <Spinner size="sm" />
          </div>
        ) : activity.length === 0 ? (
          <p className="text-muted mb-0">No activity recorded yet.</p>
        ) : (
          <div className="d-flex flex-column gap-3">
            {activity.map((item) => (
              <div key={item._id} className="border-bottom pb-3">
                <div className="d-flex justify-content-between gap-2">
                  <strong>{item.action}</strong>
                  <small className="text-muted">{new Date(item.createdAt).toLocaleString()}</small>
                </div>
                <div className="text-muted small">{item.userName}</div>
                {item.details && <div className="small mt-1">{item.details}</div>}
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default RecentActivityFeed
