'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'
import { PlanStatus, PlanType } from '@prisma/client'

export async function getMembershipPlans(filters?: {
  search?: string
  status?: PlanStatus
  planType?: string
  page?: number
  limit?: number
}) {
  const context = await requirePermission('membership-plans.view')

  const page = filters?.page || 1
  const limit = filters?.limit || 20
  const skip = (page - 1) * limit

  const where: any = {
    tenantId: context.tenantId,
    ...(filters?.status && { status: filters.status }),
    ...(filters?.planType && { planType: filters.planType }),
    ...(filters?.search && {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
  }

  const plansPromise = prisma.membershipPlan.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  })

  const totalPromise = prisma.membershipPlan.count({ where })

  const [plans, total] = await Promise.all([plansPromise, totalPromise])

  return {
    plans,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getMembershipPlan(id: string) {
  const context = await requirePermission('membership-plans.view')

  const plan = await prisma.membershipPlan.findFirst({
    where: {
      id,
      tenantId: context.tenantId,
    },
  })

  if (!plan) {
    throw new Error('Plan not found')
  }

  return plan
}

export async function createMembershipPlan(data: {
  name: string
  description?: string
  planType: PlanType
  duration: number
  price: number | string
  setupFee?: number | string
  gymAccess?: boolean
  poolAccess?: boolean
  lockerAccess?: boolean
  personalTrainer?: boolean
  groupClasses?: boolean
  maxClasses?: number
  features?: string[]
}) {
  const context = await requirePermission('membership-plans.create')

  const plan = await prisma.membershipPlan.create({
    data: {
      tenantId: context.tenantId,
      name: data.name,
      description: data.description,
      planType: data.planType,
      duration: data.duration,
      price: String(data.price),
      setupFee: data.setupFee ? String(data.setupFee) : '0',
      gymAccess: data.gymAccess ?? true,
      poolAccess: data.poolAccess ?? false,
      lockerAccess: data.lockerAccess ?? false,
      personalTrainer: data.personalTrainer ?? false,
      groupClasses: data.groupClasses ?? false,
      maxClasses: data.maxClasses,
      features: data.features || [],
      status: 'ACTIVE',
    },
  })

  await AuditLogger.logCreate(
    context.userId,
    context.tenantId,
    'MembershipPlan',
    plan.id,
    plan as any
  )

  return plan
}

export async function updateMembershipPlan(
  id: string,
  data: {
    name?: string
    description?: string
    planType?: PlanType
    duration?: number
    price?: number | string
    setupFee?: number | string
    gymAccess?: boolean
    poolAccess?: boolean
    lockerAccess?: boolean
    personalTrainer?: boolean
    groupClasses?: boolean
    maxClasses?: number
    features?: string[]
    status?: PlanStatus
  }
) {
  const context = await requirePermission('membership-plans.update')

  const oldPlan = await prisma.membershipPlan.findFirst({
    where: {
      id,
      tenantId: context.tenantId,
    },
  })

  if (!oldPlan) {
    throw new Error('Plan not found')
  }

  const updateData: any = { ...data }
  if (data.price !== undefined) updateData.price = String(data.price)
  if (data.setupFee !== undefined) updateData.setupFee = String(data.setupFee)

  const plan = await prisma.membershipPlan.update({
    where: {
      id,
      tenantId: context.tenantId,
    },
    data: updateData,
  })

  await AuditLogger.logUpdate(
    context.userId,
    context.tenantId,
    'MembershipPlan',
    plan.id,
    oldPlan as any,
    plan as any
  )

  return plan
}

export async function deleteMembershipPlan(id: string) {
  const context = await requirePermission('membership-plans.delete')

  const plan = await prisma.membershipPlan.findFirst({
    where: {
      id,
      tenantId: context.tenantId,
    },
  })

  if (!plan) {
    throw new Error('Plan not found')
  }

  await prisma.membershipPlan.update({
    where: {
      id,
      tenantId: context.tenantId,
    },
    data: { status: 'INACTIVE' },
  })

  await AuditLogger.logDelete(
    context.userId,
    context.tenantId,
    'MembershipPlan',
    id
  )

  return { success: true }
}
