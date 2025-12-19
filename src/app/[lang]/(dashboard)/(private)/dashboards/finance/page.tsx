import type { Metadata } from 'next'
import { requirePermission } from '@/libs/serverAuth'
import FinancialDashboard from '@/views/apps/dashboards/FinancialDashboard'

export const metadata: Metadata = {
  title: 'Financial Reports',
  description: 'Revenue analytics, profits, and business metrics',
}

export default async function FinancialPage() {
  await requirePermission('finance.view')

  return <FinancialDashboard />
}
