import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Gym Dashboard',
  description: 'Branch management dashboard',
}

export default async function DashboardCRM() {
  redirect('/en/dashboards/manager')
}
