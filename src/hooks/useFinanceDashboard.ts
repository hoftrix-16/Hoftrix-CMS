import { useEffect, useState } from 'react'
import api from '@/helpers/api'
import type { FinanceDashboardData } from '@/types/dashboard'

export function useFinanceDashboard() {
  const [data, setData] = useState<FinanceDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<FinanceDashboardData>('/erp/dashboard/finance')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}
