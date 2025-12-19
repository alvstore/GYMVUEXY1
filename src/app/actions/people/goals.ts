'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'
import { BranchScopeBuilder, PaginationHelper } from '@/libs/branchScope'

export async function createMemberGoal(data: {
  memberId: string
  goalType: 'WEIGHT_LOSS' | 'WEIGHT_GAIN' | 'MUSCLE_GAIN' | 'ENDURANCE' | 'FLEXIBILITY' | 'CUSTOM'
  targetValue?: number
  targetUnit?: string
  startDate: Date
  targetDate: Date
  assignedTrainerId?: string
  description?: string
}) {
  const context = await requirePermission('members.update')

  const member = await prisma.member.findFirst({
    where: BranchScopeBuilder.memberWhere(context, { id: data.memberId }),
  })

  if (!member) throw new Error('Member not found')

  const goal = await prisma.memberGoal.create({
    data: {
      tenantId: context.tenantId,
      branchId: member.branchId,
      memberId: data.memberId,
      goalType: data.goalType,
      targetValue: data.targetValue,
      targetUnit: data.targetUnit,
      startDate: data.startDate,
      targetDate: data.targetDate,
      assignedTrainerId: data.assignedTrainerId,
      description: data.description,
      status: 'ACTIVE',
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: member.branchId,
    action: 'MemberGoal.created',
    resource: 'MemberGoal',
    resourceId: goal.id,
    newValues: {
      goalType: goal.goalType,
      memberId: goal.memberId,
      targetDate: goal.targetDate
    }
  })

  return goal
}

export async function updateGoalProgress(goalId: string, data: {
  currentValue?: number
  progressNotes?: string
  completionPercentage?: number
}) {
  const context = await requirePermission('members.update')

  const goal = await prisma.memberGoal.findFirst({
    where: {
      id: goalId,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
  })

  if (!goal) throw new Error('Goal not found')

  const updated = await prisma.memberGoal.update({
    where: { id: goalId },
    data: {
      currentValue: data.currentValue,
      progressNotes: data.progressNotes,
      completionPercentage: data.completionPercentage,
      ...(data.completionPercentage === 100 && { status: 'COMPLETED', completedAt: new Date() }),
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: goal.branchId,
    action: 'MemberGoal.updated',
    resource: 'MemberGoal',
    resourceId: goalId,
    newValues: {
      currentValue: data.currentValue,
      completionPercentage: data.completionPercentage,
      status: updated.status
    }
  })

  return updated
}

export async function getAllGoals(filters?: {
  page?: number
  limit?: number
}) {
  const context = await requirePermission('members.view')
  const { page, limit, skip, take } = PaginationHelper.getSkipTake(filters)

  const results = await Promise.all([
    prisma.memberGoal.findMany({
      where: {
        tenantId: context.tenantId,
        ...(context.branchId && { branchId: context.branchId }),
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignedTrainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.memberGoal.count({
      where: {
        tenantId: context.tenantId,
        ...(context.branchId && { branchId: context.branchId }),
      },
    }),
  ])

  const [goals, total] = results

  return PaginationHelper.buildResult(goals, total, page, limit)
}

export async function getMemberGoals(memberId: string) {
  const context = await requirePermission('members.view')

  const member = await prisma.member.findFirst({
    where: BranchScopeBuilder.memberWhere(context, { id: memberId }),
  })

  if (!member) throw new Error('Member not found')

  const goals = await prisma.memberGoal.findMany({
    where: {
      memberId,
      tenantId: context.tenantId,
    },
    include: {
      assignedTrainer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return goals
}

export async function uploadProgressPhoto(goalId: string, photoUrl: string, notes?: string) {
  const context = await requirePermission('members.update')

  const goal = await prisma.memberGoal.findFirst({
    where: {
      id: goalId,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    include: { member: true },
  })

  if (!goal) throw new Error('Goal not found')

  const photo = await prisma.progressPhoto.create({
    data: {
      tenantId: context.tenantId,
      branchId: goal.branchId,
      memberId: goal.memberId,
      photoUrl,
      notes,
      takenAt: new Date(),
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: goal.branchId,
    action: 'ProgressPhoto.uploaded',
    resource: 'ProgressPhoto',
    resourceId: photo.id,
    newValues: {
      goalId: goalId,
      memberId: goal.memberId
    }
  })

  return photo
}
