import { prisma } from '@/lib/prisma'
import { MembershipPlan, PlanStatus } from '@prisma/client'

export interface CreateMembershipPlanData {
  branchId: string
  name: string
  description?: string
  duration: number // Duration in days
  price: number
  setupFee?: number
  features: string[]
  maxClasses?: number
  gymAccess?: boolean
  poolAccess?: boolean
  lockerAccess?: boolean
  personalTrainer?: boolean
}

export interface UpdateMembershipPlanData extends Partial<CreateMembershipPlanData> {
  id: string
  status?: PlanStatus
}

export class MembershipPlanService {
  static async createPlan(data: CreateMembershipPlanData): Promise<MembershipPlan> {
    return await prisma.membershipPlan.create({
      data: {
        ...data,
        setupFee: data.setupFee || 0,
        features: data.features,
        gymAccess: data.gymAccess ?? true,
        poolAccess: data.poolAccess ?? false,
        lockerAccess: data.lockerAccess ?? false,
        personalTrainer: data.personalTrainer ?? false,
        status: 'ACTIVE',
      },
    })
  }

  static async updatePlan(data: UpdateMembershipPlanData): Promise<MembershipPlan> {
    const { id, ...updateData } = data
    return await prisma.membershipPlan.update({
      where: { id },
      data: updateData,
    })
  }

  static async deletePlan(id: string): Promise<void> {
    await prisma.membershipPlan.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })
  }

  static async getPlan(id: string) {
    return await prisma.membershipPlan.findUnique({
      where: { id },
      include: {
        branch: true,
        memberPlans: {
          include: {
            member: true,
          },
          where: {
            status: 'ACTIVE',
          },
        },
      },
    })
  }

  static async getPlans(branchId?: string) {
    return await prisma.membershipPlan.findMany({
      where: {
        ...(branchId && { branchId }),
        status: { not: 'ARCHIVED' },
      },
      include: {
        branch: true,
        _count: {
          select: {
            memberPlans: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
      orderBy: { price: 'asc' },
    })
  }

  static async getPopularPlans(branchId?: string, limit = 5) {
    return await prisma.membershipPlan.findMany({
      where: {
        ...(branchId && { branchId }),
        status: 'ACTIVE',
      },
      include: {
        _count: {
          select: {
            memberPlans: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
      orderBy: {
        memberPlans: {
          _count: 'desc',
        },
      },
      take: limit,
    })
  }

  static async getPlanRevenue(planId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      planId,
      status: 'ACTIVE',
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    const memberships = await prisma.memberMembership.findMany({
      where,
      include: {
        plan: true,
        invoice: true,
      },
    })

    const totalRevenue = memberships.reduce((sum, membership) => {
      return sum + (membership.invoice ? Number(membership.invoice.totalAmount) : 0)
    }, 0)

    return {
      totalRevenue,
      membershipCount: memberships.length,
      memberships,
    }
  }
}