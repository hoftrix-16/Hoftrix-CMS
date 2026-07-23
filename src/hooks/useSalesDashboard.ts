import { useEffect, useState } from 'react'
import api from '@/helpers/api'
import type { SalesDashboardData } from '@/types/dashboard'

export function useSalesDashboard() {
  const [data, setData] = useState<SalesDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<SalesDashboardData>('/erp/dashboard/sales')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}
