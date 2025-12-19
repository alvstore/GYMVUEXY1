import type { Metadata } from 'next'
import MemberPortal from '@/views/apps/dashboards/MemberPortal'
import { requirePermission } from '@/libs/serverAuth'
import { prisma } from '@/libs/prisma'

export const metadata: Metadata = {
  title: 'My Membership',
  description: 'Manage your membership, book classes, and track progress',
}

export default async function MemberPortalPage() {
  const context = await requirePermission('self.view')
  
  // Get member linked to current user
  const member = await prisma.member.findFirst({
    where: { 
      userId: context.userId,
      tenantId: context.tenantId,
    },
  })

  if (!member) {
    return <div>No member profile found. Please contact support.</div>
  }

  return <MemberPortal memberId={member.id} />
}
