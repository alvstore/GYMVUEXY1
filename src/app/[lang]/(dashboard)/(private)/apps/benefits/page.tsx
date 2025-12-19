import BenefitDashboard from '@/views/apps/benefits/BenefitDashboard'
import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'

const BenefitsPage = async ({ searchParams }: { searchParams: { memberId?: string } }) => {
  const context = await requirePermission('members.view')

  if (!searchParams.memberId) {
    return <BenefitDashboard balances={[]} transactions={[]} />
  }

  const [balances, transactions] = await Promise.all([
    prisma.memberBenefitBalance.findMany({
      where: {
        memberId: searchParams.memberId,
        tenantId: context.tenantId,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.benefitTransaction.findMany({
      where: {
        memberId: searchParams.memberId,
        tenantId: context.tenantId,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ])

  return <BenefitDashboard balances={balances} transactions={transactions} />
}

export default BenefitsPage
