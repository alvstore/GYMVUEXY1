import type { Metadata } from 'next'
import StaffDashboard from '@/views/apps/dashboards/StaffDashboard'
import { requirePermission } from '@/libs/serverAuth'

export const metadata: Metadata = {
  title: 'Staff Dashboard',
  description: 'Daily operations and attendance tracking',
}

export default async function StaffDashboardPage() {
  await requirePermission('attendance.view')

  return <StaffDashboard />
}
