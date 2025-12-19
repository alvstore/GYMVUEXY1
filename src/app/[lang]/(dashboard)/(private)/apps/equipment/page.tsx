import type { Metadata } from 'next'
import { requirePermission } from '@/libs/serverAuth'
import EquipmentDashboard from '@/views/apps/equipment/EquipmentDashboard'

export const metadata: Metadata = {
  title: 'Equipment Tracking',
  description: 'Manage gym equipment, maintenance schedules, and inventory',
}

export default async function EquipmentPage() {
  await requirePermission('equipment.view')

  return <EquipmentDashboard />
}
