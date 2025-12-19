import type { Metadata } from 'next'
import AdminDashboard from '@/views/apps/dashboards/AdminDashboard'
import { requirePermission } from '@/libs/serverAuth'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Tenant-wide administration and branch management',
}

export default async function AdminDashboardPage() {
  await requirePermission('dashboard.view')
  
  return <AdminDashboard />
}
