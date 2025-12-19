import PlanListTable from "@/views/apps/membership-plans/list/PlanListTable"
import { getMembershipPlans } from "@/app/actions/membershipPlans"

const MembershipPlansPage = async () => {
  const result = await getMembershipPlans({ page: 1, limit: 100 })

  // Serialize Prisma objects (convert Decimal to string, Date to ISO string)
  const serializedPlans = result.plans.map((plan: any) => ({
    ...plan,
    price: String(plan.price),
    setupFee: String(plan.setupFee),
    createdAt: plan.createdAt?.toISOString() || '',
    updatedAt: plan.updatedAt?.toISOString() || '',
  }))

  return <PlanListTable planData={serializedPlans} />
}

export default MembershipPlansPage
