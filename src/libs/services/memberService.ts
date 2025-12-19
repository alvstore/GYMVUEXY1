import { prisma } from '@/lib/prisma'
import { Member, MemberStatus, Gender, ActivityLevel, FoodPreference, MembershipPlan, MemberMembership, MembershipStatus } from '@prisma/client'

export interface CreateMemberData {
  branchId: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  dateOfBirth?: Date
  gender?: Gender
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  height?: number
  weight?: number
  bloodGroup?: string
  medicalConditions?: string
  allergies?: string
  foodPreference?: FoodPreference
  activityLevel?: ActivityLevel
  notes?: string
}

export interface UpdateMemberData extends Partial<CreateMemberData> {
  id: string
  status?: MemberStatus
}

export interface MemberFilters {
  branchId?: string
  status?: MemberStatus
  search?: string
  membershipStatus?: MembershipStatus
}

export interface AssignMembershipData {
  memberId: string
  planId: string
  branchId: string
  startDate: Date
  notes?: string
}

export class MemberService {
  static async createMember(data: CreateMemberData, tenantId: string): Promise<Member> {
    // Generate membership ID
    const membershipId = await this.generateMembershipId(data.branchId)

    return await prisma.member.create({
      data: {
        ...data,
        tenantId,
        membershipId,
        status: 'ACTIVE',
      },
    })
  }

  static async updateMember(data: UpdateMemberData): Promise<Member> {
    const { id, ...updateData } = data
    return await prisma.member.update({
      where: { id },
      data: updateData,
    })
  }

  static async deleteMember(id: string): Promise<void> {
    await prisma.member.delete({
      where: { id },
    })
  }

  static async getMember(id: string) {
    return await prisma.member.findUnique({
      where: { id },
      include: {
        branch: true,
        memberships: {
          include: {
            plan: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        measurements: {
          orderBy: { measurementDate: 'desc' },
          take: 5,
        },
        lockerAssignments: {
          where: { status: 'ACTIVE' },
          include: {
            locker: true,
          },
        },
        trainerAssignments: {
          where: { status: 'ACTIVE' },
          include: {
            trainer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })
  }

  static async getMembers(filters: MemberFilters = {}, page = 1, limit = 20) {
    const where: any = {}

    if (filters.branchId) {
      where.branchId = filters.branchId
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { membershipId: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.membershipStatus) {
      where.memberships = {
        some: {
          status: filters.membershipStatus,
          endDate: { gte: new Date() },
        },
      }
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        include: {
          branch: true,
          memberships: {
            where: {
              status: 'ACTIVE',
              endDate: { gte: new Date() },
            },
            include: {
              plan: true,
            },
            take: 1,
            orderBy: { endDate: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.member.count({ where }),
    ])

    return {
      members,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  static async assignMembership(data: AssignMembershipData) {
    const { memberId, planId, branchId, startDate, notes } = data

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { branch: true },
    })

    if (!member) {
      throw new Error('Member not found')
    }

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      throw new Error('Membership plan not found')
    }

    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + plan.duration)

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { branchId }
    })
    const invoiceNumber = `INV-${branchId.slice(-4).toUpperCase()}-${String(invoiceCount + 1).padStart(4, '0')}`

    const result = await prisma.$transaction(async (tx) => {
      // Create membership assignment
      const membership = await tx.memberMembership.create({
        data: {
          memberId,
          planId,
          branchId,
          startDate,
          endDate,
          status: 'ACTIVE',
          notes,
        },
      })

      // Create invoice placeholder
      const invoice = await tx.invoice.create({
        data: {
          tenantId: member.tenantId,
          branchId,
          invoiceNumber,
          memberId: member.id,
          membershipId: membership.id,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          subtotal: plan.price + plan.setupFee,
          totalAmount: plan.price + plan.setupFee,
          status: 'DRAFT',
          notes: `Membership: ${plan.name}`,
        },
      })

      return { membership, invoice }
    })

    return result
  }

  static async convertLeadToMember(leadId: string, memberData: CreateMemberData, tenantId: string) {
    // This is a stub for now - in Phase 3 we'll implement proper lead management
    // For now, just create a member directly
    return await this.createMember(memberData, tenantId)
  }

  static async getMembershipPlans(branchId?: string) {
    return await prisma.membershipPlan.findMany({
      where: {
        status: 'ACTIVE',
        ...(branchId && { 
          OR: [
            { branchId },
            { branchId: null }, // Include tenant-wide plans
          ]
        }),
      },
      orderBy: { price: 'asc' },
    })
  }

  static async getMemberStats(branchId?: string) {
    const where = branchId ? { branchId } : {}

    const [
      totalMembers,
      activeMembers,
      expiredMembers,
      newMembersThisMonth,
    ] = await Promise.all([
      prisma.member.count({ where }),
      prisma.member.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.member.count({ where: { ...where, status: 'EXPIRED' } }),
      prisma.member.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ])

    return {
      totalMembers,
      activeMembers,
      expiredMembers,
      newMembersThisMonth,
    }
  }

  private static async generateMembershipId(branchId: string): Promise<string> {
    const branchCode = branchId.slice(-4).toUpperCase()
    const memberCount = await prisma.member.count({ where: { branchId } })
    return `${branchCode}${String(memberCount + 1).padStart(4, '0')}`
  }
}