import { useEffect, useState } from 'react'
import api from '@/helpers/api'
import type { AnalyticsDashboardData } from '@/types/dashboard'

export function useAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<AnalyticsDashboardData>('/erp/dashboard/analytics')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}
