import type { Metadata } from 'next'
import StaffDashboard from '@/views/dashboards/StaffDashboard'
import { requirePermission } from '@/libs/serverAuth'

export const metadata: Metadata = {
  title: 'Staff Dashboard',
  description: 'Daily operations, attendance tracking, and quick actions',
}

export default async function StaffDashboardPage() {
  await requirePermission('attendance.view')

  return <StaffDashboard />
}
