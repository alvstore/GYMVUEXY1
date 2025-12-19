'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'

export async function pauseMembership(data: {
  membershipId: string
  effectiveDate: Date
  durationDays: number
  reason: string
  notes?: string
}) {
  const context = await requirePermission('memberships.lifecycle')

  const membership = await prisma.memberMembership.findFirst({
    where: {
      id: data.membershipId,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
  })

  if (!membership) throw new Error('Membership not found')

  const event = await prisma.membershipLifecycleEvent.create({
    data: {
      tenantId: context.tenantId,
      branchId: membership.branchId,
      memberId: membership.memberId,
      membershipId: data.membershipId,
      eventType: 'PAUSED',
      effectiveDate: data.effectiveDate,
      durationDays: data.durationDays,
      reason: data.reason,
      notes: data.notes,
      previousData: membership as any,
      performedBy: context.userId,
    },
  })

  const newEndDate = new Date(membership.endDate)
  newEndDate.setDate(newEndDate.getDate() + data.durationDays)

  await prisma.memberMembership.update({
    where: { id: data.membershipId },
    data: {
      status: 'FROZEN' as any,
      endDate: newEndDate,
      freezeDays: membership.freezeDays + data.durationDays,
    },
  })

  await AuditLogger.logUpdate(
    context.userId,
    context.tenantId,
    'MemberMembership',
    membership.id,
    membership as any,
    { ...membership, freezeDays: membership.freezeDays + data.durationDays } as any,
    membership.branchId
  )

  return event
}

export async function resumeMembership(data: {
  membershipId: string
  effectiveDate: Date
  notes?: string
}) {
  const context = await requirePermission('memberships.lifecycle')

  const membership = await prisma.memberMembership.findFirst({
    where: {
      id: data.membershipId,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
  })

  if (!membership) throw new Error('Membership not found')

  const event = await prisma.membershipLifecycleEvent.create({
    data: {
      tenantId: context.tenantId,
      branchId: membership.branchId,
      memberId: membership.memberId,
      membershipId: data.membershipId,
      eventType: 'RESUMED',
      effectiveDate: data.effectiveDate,
      notes: data.notes,
      previousData: membership as any,
      performedBy: context.userId,
    },
  })

  await prisma.memberMembership.update({
    where: { id: data.membershipId },
    data: {
      status: 'ACTIVE',
    },
  })

  await AuditLogger.logUpdate(
    context.userId,
    context.tenantId,
    'MemberMembership',
    membership.id,
    membership as any,
    { ...membership, status: 'ACTIVE' } as any,
    membership.branchId
  )

  return event
}

export async function upgradeMembership(data: {
  membershipId: string
  newPlanId: string
  effectiveDate: Date
  proRataCredit?: number
  notes?: string
}) {
  const context = await requirePermission('memberships.lifecycle')

  const membership = await prisma.memberMembership.findFirst({
    where: {
      id: data.membershipId,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
  })

  if (!membership) throw new Error('Membership not found')

  const newPlan = await prisma.membershipPlan.findFirst({
    where: {
      id: data.newPlanId,
      tenantId: context.tenantId,
    },
  })

  if (!newPlan) throw new Error('New plan not found')

  const event = await prisma.membershipLifecycleEvent.create({
    data: {
      tenantId: context.tenantId,
      branchId: membership.branchId,
      memberId: membership.memberId,
      membershipId: data.membershipId,
      eventType: 'UPGRADED',
      effectiveDate: data.effectiveDate,
      oldPlanId: membership.planId,
      newPlanId: data.newPlanId,
      notes: data.notes,
      previousData: membership as any,
      performedBy: context.userId,
    },
  })

  await prisma.memberMembership.update({
    where: { id: data.membershipId },
    data: { planId: data.newPlanId },
  })

  return event
}

export async function cancelMembership(data: {
  membershipId: string
  effectiveDate: Date
  reason: string
  refundAmount?: number
  notes?: string
}) {
  const context = await requirePermission('memberships.lifecycle')

  const membership = await prisma.memberMembership.findFirst({
    where: {
      id: data.membershipId,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
  })

  if (!membership) throw new Error('Membership not found')

  const event = await prisma.membershipLifecycleEvent.create({
    data: {
      tenantId: context.tenantId,
      branchId: membership.branchId,
      memberId: membership.memberId,
      membershipId: data.membershipId,
      eventType: 'CANCELLED',
      effectiveDate: data.effectiveDate,
      reason: data.reason,
      notes: data.notes,
      previousData: membership as any,
      performedBy: context.userId,
    },
  })

  await prisma.memberMembership.update({
    where: { id: data.membershipId },
    data: {
      status: 'INACTIVE',
      endDate: data.effectiveDate,
    },
  })

  return event
}

export async function getLifecycleHistory(membershipId: string) {
  const context = await requirePermission('memberships.view')

  const events = await prisma.membershipLifecycleEvent.findMany({
    where: {
      membershipId,
      tenantId: context.tenantId,
    },
    orderBy: { createdAt: 'desc' },
  })

  return events
}
