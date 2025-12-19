import type { Metadata } from 'next'
import { requirePermission } from '@/libs/serverAuth'
import LeadPipeline from '@/views/apps/leads/LeadPipeline'

export const metadata: Metadata = {
  title: 'Lead Pipeline',
  description: 'Track and manage sales leads through your conversion funnel',
}

export default async function PipelinePage() {
  await requirePermission('leads.view')

  return <LeadPipeline />
}
