import PlanCatalog from '@/views/apps/plans/PlanCatalog'
import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'

const PlansPage = async () => {
  const context = await requirePermission('plans.view')

  const plans = await prisma.membershipPlan.findMany({
    where: {
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    include: {
      benefits: {
        where: { isActive: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return <PlanCatalog plans={plans} />
}

export default PlansPage
