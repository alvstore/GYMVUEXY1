'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'
import { BranchScopeBuilder, PaginationHelper } from '@/libs/branchScope'

export async function createMemberGoal(data: {
  memberId: string
  goalType: 'WEIGHT_LOSS' | 'WEIGHT_GAIN' | 'MUSCLE_BUILDING' | 'FAT_LOSS' | 'STRENGTH_GAIN' | 'ENDURANCE' | 'FLEXIBILITY' | 'GENERAL_FITNESS' | 'CUSTOM'
  title: string
  description?: string
  targetWeight?: number
  targetBodyFat?: number
  targetMuscle?: number
  customMetric?: string
  customTarget?: string
  targetDate: Date
  assignedTrainerId?: string
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
      title: data.title,
      description: data.description,
      targetWeight: data.targetWeight,
      targetBodyFat: data.targetBodyFat,
      targetMuscle: data.targetMuscle,
      customMetric: data.customMetric,
      customTarget: data.customTarget,
      targetDate: data.targetDate,
      assignedTrainerId: data.assignedTrainerId,
      status: 'ACTIVE',
      progress: 0,
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
  progress?: number
  notes?: string
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
      progress: data.progress,
      notes: data.notes,
      ...(data.progress === 100 && { status: 'ACHIEVED', achievedDate: new Date() }),
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
      progress: data.progress,
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

  const [goals, total] = await Promise.all([
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
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
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return goals
}

export async function uploadProgressPhoto(memberId: string, memberPlanId: string, imageUrl: string, caption?: string, photoType?: string) {
  const context = await requirePermission('members.update')

  const member = await prisma.member.findFirst({
    where: BranchScopeBuilder.memberWhere(context, { id: memberId }),
  })

  if (!member) throw new Error('Member not found')

  const photo = await prisma.progressPhoto.create({
    data: {
      memberPlanId,
      memberId,
      branchId: member.branchId,
      imageUrl,
      caption,
      photoType,
      measurementDate: new Date(),
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: member.branchId,
    action: 'ProgressPhoto.uploaded',
    resource: 'ProgressPhoto',
    resourceId: photo.id,
    newValues: {
      memberId,
      photoType
    }
  })

  return photo
}
