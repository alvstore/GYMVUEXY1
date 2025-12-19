import { prisma } from '@/lib/prisma'
import { Lead, LeadStatus, LeadSource } from '@prisma/client'

export interface CreateLeadData {
  branchId: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  source: LeadSource
  interestedPlans?: string[]
  notes?: string
  followUpDate?: Date
  createdBy: string
}

export interface UpdateLeadData extends Partial<CreateLeadData> {
  id: string
  status?: LeadStatus
}

export interface LeadFilters {
  branchId?: string
  status?: LeadStatus
  source?: LeadSource
  search?: string
  followUpDue?: boolean
}

export class LeadService {
  static async createLead(data: CreateLeadData): Promise<Lead> {
    return await prisma.lead.create({
      data: {
        ...data,
        interestedPlans: data.interestedPlans || [],
        status: 'NEW',
      },
    })
  }

  static async updateLead(data: UpdateLeadData): Promise<Lead> {
    const { id, ...updateData } = data
    return await prisma.lead.update({
      where: { id },
      data: updateData,
    })
  }

  static async deleteLead(id: string): Promise<void> {
    await prisma.lead.delete({
      where: { id },
    })
  }

  static async getLead(id: string) {
    return await prisma.lead.findUnique({
      where: { id },
      include: {
        branch: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        followUps: {
          orderBy: { createdAt: 'desc' },
        },
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
    })
  }

  static async getLeads(filters: LeadFilters = {}, page = 1, limit = 20) {
    const where: any = {}

    if (filters.branchId) {
      where.branchId = filters.branchId
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.source) {
      where.source = filters.source
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.followUpDue) {
      where.followUpDate = {
        lte: new Date(),
      }
      where.status = {
        not: 'CONVERTED',
      }
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          member: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ])

    return {
      leads,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  static async addFollowUp(leadId: string, notes: string, nextFollowUp?: Date) {
    return await prisma.leadFollowUp.create({
      data: {
        leadId,
        notes,
        nextFollowUp,
      },
    })
  }

  static async convertToMember(leadId: string, memberData: any) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    })

    if (!lead) {
      throw new Error('Lead not found')
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create member
      const member = await tx.member.create({
        data: {
          branchId: lead.branchId,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email || memberData.email,
          phone: lead.phone,
          ...memberData,
          status: 'NO_MEMBERSHIP',
        },
      })

      // Update lead status
      await tx.lead.update({
        where: { id: leadId },
        data: {
          status: 'CONVERTED',
          convertedAt: new Date(),
        },
      })

      return member
    })

    return result
  }

  static async getLeadStats(branchId?: string) {
    const where = branchId ? { branchId } : {}

    const [
      totalLeads,
      newLeads,
      convertedLeads,
      followUpDue,
      conversionRate,
    ] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.count({ where: { ...where, status: 'NEW' } }),
      prisma.lead.count({ where: { ...where, status: 'CONVERTED' } }),
      prisma.lead.count({
        where: {
          ...where,
          followUpDate: { lte: new Date() },
          status: { not: 'CONVERTED' },
        },
      }),
      prisma.lead.count({ where }),
    ])

    return {
      totalLeads,
      newLeads,
      convertedLeads,
      followUpDue,
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
    }
  }

  static async getLeadsBySource(branchId?: string) {
    const where = branchId ? { branchId } : {}

    return await prisma.lead.groupBy({
      by: ['source'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    })
  }

  static async getMonthlyLeadTrend(branchId?: string, months = 12) {
    const where = branchId ? { branchId } : {}
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const leads = await prisma.lead.findMany({
      where: {
        ...where,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        status: true,
      },
    })

    // Group by month
    const monthlyData = leads.reduce((acc, lead) => {
      const month = lead.createdAt.toISOString().slice(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { total: 0, converted: 0 }
      }
      acc[month].total++
      if (lead.status === 'CONVERTED') {
        acc[month].converted++
      }
      return acc
    }, {} as Record<string, { total: number; converted: number }>)

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      totalLeads: data.total,
      convertedLeads: data.converted,
      conversionRate: (data.converted / data.total) * 100,
    }))
  }
}