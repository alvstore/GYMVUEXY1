'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import type { Referral } from '@/types/apps/referralTypes'

export async function getReferrals(): Promise<Referral[]> {
  const context = await requirePermission('referrals.view')
  
  const referrals = await prisma.referralTracking.findMany({
    where: { 
      referrer: {
        tenantId: context.tenantId!,
      },
    },
    include: {
      referrer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      },
      referred: {
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
    refereeName: `${ref.referred.firstName} ${ref.referred.lastName}`,
    refereeEmail: ref.referred.email || '',
    refereePhone: ref.referred.phone || '',
    status: ref.status as 'PENDING' | 'COMPLETED' | 'REWARDED',
    rewardAmount: Number(ref.bonusAwarded || 0),
    rewardType: 'Credit',
    createdAt: ref.referredAt.toISOString().split('T')[0],
    completedAt: ref.completedAt?.toISOString().split('T')[0],
  }))
}

export async function createReferral(data: {
  referrerId: string
  referredId: string
  notes?: string
}) {
  const context = await requirePermission('referrals.create')
  
  const referrer = await prisma.member.findFirst({
    where: { id: data.referrerId, tenantId: context.tenantId! }
  })
  
  if (!referrer) throw new Error('Referrer not found')
  
  const referral = await prisma.referralTracking.create({
    data: {
      referrerId: data.referrerId,
      referredId: data.referredId,
      status: 'PENDING',
      bonusAwarded: 0,
      notes: data.notes,
    },
  })

  return referral
}

export async function completeReferral(referralId: string) {
  const context = await requirePermission('referrals.update')
  
  const existing = await prisma.referralTracking.findFirst({
    where: { id: referralId },
    include: { referrer: true }
  })
  
  if (!existing || existing.referrer.tenantId !== context.tenantId) {
    throw new Error('Referral not found')
  }
  
  const referral = await prisma.referralTracking.update({
    where: { id: referralId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  })

  return referral
}

export async function processReferralReward(referralId: string, bonusAmount: number = 500) {
  const context = await requirePermission('referrals.update')
  
  const existing = await prisma.referralTracking.findFirst({
    where: { id: referralId },
    include: { referrer: true }
  })
  
  if (!existing || existing.referrer.tenantId !== context.tenantId) {
    throw new Error('Referral not found')
  }
  
  const referral = await prisma.referralTracking.update({
    where: { id: referralId },
    data: {
      status: 'COMPLETED',
      bonusAwarded: bonusAmount,
    },
  })

  return referral
}
