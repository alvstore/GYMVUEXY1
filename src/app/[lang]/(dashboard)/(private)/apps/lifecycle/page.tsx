import LifecycleManagement from '@/views/apps/lifecycle/LifecycleManagement'
import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'

const LifecyclePage = async ({ searchParams }: { searchParams: { membershipId?: string } }) => {
  const context = await requirePermission('memberships.view')

  if (!searchParams.membershipId) {
    return <LifecycleManagement membership={null} events={[]} />
  }

  const [membership, events] = await Promise.all([
    prisma.memberMembership.findFirst({
      where: {
        id: searchParams.membershipId,
        tenantId: context.tenantId,
      },
      include: {
        plan: true,
      },
    }),
    prisma.membershipLifecycleEvent.findMany({
      where: {
        membershipId: searchParams.membershipId,
        tenantId: context.tenantId,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return <LifecycleManagement membership={membership} events={events} />
}

export default LifecyclePage
