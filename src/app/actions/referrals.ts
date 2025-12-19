'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import type { Referral } from '@/types/apps/referralTypes'

export async function getReferrals(): Promise<Referral[]> {
  const context = await requirePermission('referrals.view')
  
  const referrals = await prisma.referral.findMany({
    where: { 
      tenantId: context.tenantId!,
    },
    include: {
      referrer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        }
      },
      referee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return referrals.map(ref => ({
    id: ref.id,
    referrerName: `${ref.referrer.firstName} ${ref.referrer.lastName}`,
    referrerMemberId: ref.referrerId,
    refereeName: ref.referee ? `${ref.referee.firstName} ${ref.referee.lastName}` : ref.refereeEmail || 'Unknown',
    refereeEmail: ref.referee?.email || ref.refereeEmail || '',
    refereePhone: ref.referee?.phone || ref.refereePhone || '',
    status: ref.status as 'PENDING' | 'COMPLETED' | 'REWARDED',
    rewardAmount: Number(ref.rewardAmount || 0),
    rewardType: ref.rewardType || 'Discount',
    createdAt: ref.createdAt.toISOString().split('T')[0],
    completedAt: ref.completedAt?.toISOString().split('T')[0],
  }))
}

export async function createReferral(data: {
  referrerId: string
  refereeEmail: string
  refereePhone?: string
  rewardType?: string
}) {
  const context = await requirePermission('referrals.create')
  
  const referral = await prisma.referral.create({
    data: {
      tenantId: context.tenantId!,
      referrerId: data.referrerId,
      refereeEmail: data.refereeEmail,
      refereePhone: data.refereePhone,
      status: 'PENDING',
      rewardType: data.rewardType || '1 Month Free',
      rewardAmount: 500,
    },
  })

  return referral
}

export async function completeReferral(referralId: string, refereeId: string) {
  const context = await requirePermission('referrals.update')
  
  const referral = await prisma.referral.update({
    where: { id: referralId, tenantId: context.tenantId! },
    data: {
      refereeId: refereeId,
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  })

  return referral
}

export async function processReferralReward(referralId: string) {
  const context = await requirePermission('referrals.update')
  
  const referral = await prisma.referral.update({
    where: { id: referralId, tenantId: context.tenantId! },
    data: {
      status: 'REWARDED',
      rewardedAt: new Date(),
    },
  })

  return referral
}
