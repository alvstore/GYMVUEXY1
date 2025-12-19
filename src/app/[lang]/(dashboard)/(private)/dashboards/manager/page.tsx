import type { Metadata } from 'next'
import ManagerDashboard from '@/views/apps/dashboards/ManagerDashboard'
import { requirePermission } from '@/libs/serverAuth'

export const metadata: Metadata = {
  title: 'Manager Dashboard',
  description: 'Branch metrics and staff oversight',
}

export default async function ManagerDashboardPage() {
  await requirePermission('dashboard.view')

  return <ManagerDashboard />
}
