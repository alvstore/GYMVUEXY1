import { prisma } from '@/lib/prisma'
import { ReferralTracking } from '@prisma/client'

export interface CreateReferralData {
  referrerMemberId: string
  referredMemberId: string
  branchId: string
  bonusAmount: number
  bonusType: 'DISCOUNT' | 'CASH' | 'CREDIT'
}

export interface ReferralFilters {
  branchId?: string
  referrerMemberId?: string
  referredMemberId?: string
  isProcessed?: boolean
}

export class ReferralService {
  static async generateReferralCode(memberId: string): Promise<string> {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { firstName: true, lastName: true, membershipId: true },
    })

    if (!member) {
      throw new Error('Member not found')
    }

    // Generate referral code: First 3 letters of name + last 4 of membership ID
    const nameCode = (member.firstName.substring(0, 2) + member.lastName.substring(0, 1)).toUpperCase()
    const idCode = member.membershipId.slice(-4)
    const referralCode = `${nameCode}${idCode}`

    // Update member with referral code
    await prisma.member.update({
      where: { id: memberId },
      data: { referralCode },
    })

    return referralCode
  }

  static async validateReferralCode(referralCode: string, branchId: string): Promise<{ valid: boolean; referrer?: any }> {
    const referrer = await prisma.member.findFirst({
      where: {
        referralCode,
        branchId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        membershipId: true,
      },
    })

    return {
      valid: !!referrer,
      referrer,
    }
  }

  static async createReferral(data: CreateReferralData, tenantId: string): Promise<ReferralTracking> {
    // Validate that both members exist and are in the same branch
    const [referrer, referred] = await Promise.all([
      prisma.member.findUnique({ where: { id: data.referrerMemberId } }),
      prisma.member.findUnique({ where: { id: data.referredMemberId } }),
    ])

    if (!referrer || !referred) {
      throw new Error('Invalid member IDs')
    }

    if (referrer.branchId !== data.branchId || referred.branchId !== data.branchId) {
      throw new Error('Members must be in the same branch')
    }

    // Check if referral already exists
    const existingReferral = await prisma.referralTracking.findUnique({
      where: {
        referrerMemberId_referredMemberId: {
          referrerMemberId: data.referrerMemberId,
          referredMemberId: data.referredMemberId,
        },
      },
    })

    if (existingReferral) {
      throw new Error('Referral already exists')
    }

    return await prisma.referralTracking.create({
      data: {
        ...data,
        tenantId,
        referralCode: referrer.referralCode || '',
      },
    })
  }

  static async processReferralBonus(referralId: string): Promise<void> {
    const referral = await prisma.referralTracking.findUnique({
      where: { id: referralId },
      include: {
        referrer: true,
        referred: true,
      },
    })

    if (!referral) {
      throw new Error('Referral not found')
    }

    if (referral.isProcessed) {
      throw new Error('Referral bonus already processed')
    }

    await prisma.$transaction(async (tx) => {
      // Update referral as processed
      await tx.referralTracking.update({
        where: { id: referralId },
        data: {
          isProcessed: true,
          processedAt: new Date(),
        },
      })

      // Add bonus to referrer
      await tx.member.update({
        where: { id: referral.referrerMemberId },
        data: {
          referralBonus: {
            increment: referral.bonusAmount,
          },
        },
      })

      // Create transaction record for bonus
      await tx.transaction.create({
        data: {
          tenantId: referral.tenantId,
          branchId: referral.branchId,
          memberId: referral.referrerMemberId,
          transactionType: 'REFERRAL_BONUS',
          paymentMethod: 'CREDIT',
          amount: referral.bonusAmount,
          status: 'COMPLETED',
          notes: `Referral bonus for referring ${referral.referred.firstName} ${referral.referred.lastName}`,
        },
      })
    })
  }

  static async getReferrals(filters: ReferralFilters = {}, page = 1, limit = 20) {
    const where: any = {}

    if (filters.branchId) {
      where.branchId = filters.branchId
    }

    if (filters.referrerMemberId) {
      where.referrerMemberId = filters.referrerMemberId
    }

    if (filters.referredMemberId) {
      where.referredMemberId = filters.referredMemberId
    }

    if (filters.isProcessed !== undefined) {
      where.isProcessed = filters.isProcessed
    }

    const [referrals, total] = await Promise.all([
      prisma.referralTracking.findMany({
        where,
        include: {
          referrer: {
            select: {
              firstName: true,
              lastName: true,
              membershipId: true,
            },
          },
          referred: {
            select: {
              firstName: true,
              lastName: true,
              membershipId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.referralTracking.count({ where }),
    ])

    return {
      referrals,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  static async getReferralStats(branchId?: string) {
    const where = branchId ? { branchId } : {}

    const [
      totalReferrals,
      processedReferrals,
      pendingReferrals,
      totalBonusAmount,
    ] = await Promise.all([
      prisma.referralTracking.count({ where }),
      prisma.referralTracking.count({ where: { ...where, isProcessed: true } }),
      prisma.referralTracking.count({ where: { ...where, isProcessed: false } }),
      prisma.referralTracking.aggregate({
        where: { ...where, isProcessed: true },
        _sum: { bonusAmount: true },
      }),
    ])

    return {
      totalReferrals,
      processedReferrals,
      pendingReferrals,
      totalBonusAmount: Number(totalBonusAmount._sum.bonusAmount || 0),
    }
  }

  static async getTopReferrers(branchId?: string, limit = 10) {
    const where = branchId ? { branchId } : {}

    const referrers = await prisma.referralTracking.groupBy({
      by: ['referrerMemberId'],
      where,
      _count: { referredMemberId: true },
      _sum: { bonusAmount: true },
      orderBy: {
        _count: {
          referredMemberId: 'desc',
        },
      },
      take: limit,
    })

    // Get member details for each referrer
    const referrerDetails = await Promise.all(
      referrers.map(async (referrer) => {
        const member = await prisma.member.findUnique({
          where: { id: referrer.referrerMemberId },
          select: {
            firstName: true,
            lastName: true,
            membershipId: true,
            referralCode: true,
          },
        })

        return {
          member,
          totalReferrals: referrer._count.referredMemberId,
          totalBonus: Number(referrer._sum.bonusAmount || 0),
        }
      })
    )

    return referrerDetails
  }
}