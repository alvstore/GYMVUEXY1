'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { ReferralCodeGenerator, ReferralRewardCalculator } from '@/libs/referral'
import { BranchScopeBuilder, PaginationHelper } from '@/libs/branchScope'

export async function generateReferralCode(memberId: string) {
  const context = await requirePermission('members.update')

  const member = await prisma.member.findFirst({
    where: BranchScopeBuilder.memberWhere(context, { id: memberId }),
  })

  if (!member) {
    throw new Error('Member not found')
  }

  if (member.referralCode) {
    return { referralCode: member.referralCode }
  }

  const newCode = ReferralCodeGenerator.generateMemberCode(memberId)

  const updated = await prisma.member.update({
    where: { id: memberId },
    data: { referralCode: newCode },
  })

  return { referralCode: updated.referralCode }
}

export async function trackReferral(data: {
  referralCode: string
  newMemberId: string
}) {
  const context = await requirePermission('members.create')

  const referrer = await prisma.member.findFirst({
    where: {
      referralCode: data.referralCode,
      tenantId: context.tenantId,
      deletedAt: null,
    },
  })

  if (!referrer) {
    throw new Error('Invalid referral code')
  }

  const newMember = await prisma.member.findFirst({
    where: {
      id: data.newMemberId,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
  })

  if (!newMember) {
    throw new Error('New member not found or access denied')
  }

  await prisma.member.update({
    where: {
      id: data.newMemberId,
      tenantId: context.tenantId,
    },
    data: { referredBy: referrer.id },
  })

  const referral = await prisma.referralTracking.create({
    data: {
      referrerId: referrer.id,
      referredId: data.newMemberId,
      status: 'PENDING',
    },
  })

  return referral
}

export async function getReferralStats(memberId: string) {
  const context = await requirePermission('members.view')

  const member = await prisma.member.findFirst({
    where: BranchScopeBuilder.memberWhere(context, { id: memberId }),
  })

  if (!member) {
    throw new Error('Member not found')
  }

  const [successful, pending, total] = await Promise.all([
    prisma.referralTracking.count({
      where: {
        referrerId: memberId,
        status: 'COMPLETED',
      },
    }),
    prisma.referralTracking.count({
      where: {
        referrerId: memberId,
        status: 'PENDING',
      },
    }),
    prisma.referralTracking.count({
      where: {
        referrerId: memberId,
      },
    }),
  ])

  const estimatedReward = ReferralRewardCalculator.calculateReward(successful, 'DISCOUNT')

  return {
    referralCode: member.referralCode,
    successful,
    pending,
    total,
    estimatedReward,
  }
}

export async function getReferralLeaderboard(params?: { page?: number; limit?: number }) {
  const context = await requirePermission('members.view')
  const { page, limit, skip, take } = PaginationHelper.getSkipTake(params)

  const referrers = await prisma.referralTracking.groupBy({
    by: ['referrerId'],
    where: {
      status: 'COMPLETED',
    },
    _count: {
      referredId: true,
    },
    orderBy: {
      _count: {
        referredId: 'desc',
      },
    },
    skip,
    take,
  })

  const memberIds = referrers.map(r => r.referrerId)
  
  const members = await prisma.member.findMany({
    where: {
      id: { in: memberIds },
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      referralCode: true,
    },
  })

  const leaderboard = referrers.map(r => {
    const member = members.find(m => m.id === r.referrerId)
    const count = r._count?.referredId || 0
    return {
      member,
      referralCount: count,
      estimatedReward: ReferralRewardCalculator.calculateReward(count, 'DISCOUNT'),
    }
  })

  const total = await prisma.referralTracking.groupBy({
    by: ['referrerId'],
    where: {
      status: 'COMPLETED',
    },
  })

  return PaginationHelper.buildResult(leaderboard, total.length, page, limit)
}
