'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'

export async function createPlanBenefit(data: {
  planId: string
  benefitType: string
  benefitName: string
  benefitValue: number
  benefitUnit?: string
  description?: string
  isRecurring: boolean
  recurringFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  isUnlimited: boolean
}) {
  const context = await requirePermission('plans.manage')

  const plan = await prisma.membershipPlan.findFirst({
    where: {
      id: data.planId,
      tenantId: context.tenantId,
    },
  })

  if (!plan) throw new Error('Plan not found')

  const benefit = await prisma.planBenefit.create({
    data: {
      tenantId: context.tenantId,
      branchId: plan.branchId,
      planId: data.planId,
      benefitType: data.benefitType,
      benefitName: data.benefitName,
      benefitValue: data.benefitValue,
      benefitUnit: data.benefitUnit,
      description: data.description,
      isRecurring: data.isRecurring,
      recurringFrequency: data.recurringFrequency,
      isUnlimited: data.isUnlimited,
      isActive: true,
    },
  })

  await AuditLogger.logCreate(
    context.userId,
    context.tenantId,
    'PlanBenefit',
    benefit.id,
    benefit as any,
    plan.branchId
  )

  return benefit
}

export async function getPlanBenefits(planId: string) {
  const context = await requirePermission('plans.view')

  const benefits = await prisma.planBenefit.findMany({
    where: {
      planId,
      tenantId: context.tenantId,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return benefits
}

export async function initializeMemberBenefits(memberId: string, membershipId: string) {
  const context = await requirePermission('members.update')

  const membership = await prisma.memberMembership.findFirst({
    where: {
      id: membershipId,
      memberId,
      tenantId: context.tenantId,
    },
    include: {
      plan: {
        include: {
          benefits: {
            where: { isActive: true },
          },
        },
      },
    },
  })

  if (!membership) throw new Error('Membership not found')

  const balances = await Promise.all(
    membership.plan.benefits.map(benefit =>
      prisma.memberBenefitBalance.create({
        data: {
          tenantId: context.tenantId,
          branchId: membership.branchId,
          memberId,
          membershipId,
          benefitType: benefit.benefitType,
          benefitName: benefit.benefitName,
          totalBalance: benefit.isUnlimited ? 999999 : benefit.benefitValue,
          usedBalance: 0,
          remainingBalance: benefit.isUnlimited ? 999999 : benefit.benefitValue,
          isUnlimited: benefit.isUnlimited,
        },
      })
    )
  )

  return balances
}

export async function getMemberBenefits(memberId: string) {
  const context = await requirePermission('members.view')

  const balances = await prisma.memberBenefitBalance.findMany({
    where: {
      memberId,
      tenantId: context.tenantId,
    },
    orderBy: { createdAt: 'desc' },
  })

  return balances
}
