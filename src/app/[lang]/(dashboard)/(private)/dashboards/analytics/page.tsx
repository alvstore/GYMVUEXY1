import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Analytics Dashboard',
  description: 'Financial analytics and reports',
}

export default async function DashboardAnalytics() {
  redirect('/en/dashboards/finance')
}
