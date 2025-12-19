// Imports
import { Metadata } from 'next'
import CheckInDashboard from '@/views/apps/reception/CheckInDashboard'
import { requirePermission } from '@/libs/serverAuth'

export const metadata: Metadata = {
  title: 'Member Check-In',
  description: 'Check in members for daily gym operations',
}

export default async function CheckInPage() {
  // Require permission to access this page
  await requirePermission('members.checkin')

  return <CheckInDashboard />
}
