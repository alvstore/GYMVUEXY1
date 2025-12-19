export type PlanDuration = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY' | 'CUSTOM'
export type PlanStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

export type MembershipPlan = {
  id: string
  name: string
  description?: string
  duration: number
  durationType: PlanDuration
  price: number
  setupFee: number
  taxRate: number
  features: string[]
  allowFreezing: boolean
  freezeLimit: number
  status: PlanStatus
  activeSubscriptions: number
  branchId: string
  branchName?: string
  tenantId: string
  createdAt: string
}
