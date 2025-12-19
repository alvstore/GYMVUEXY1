import { prisma } from '@/lib/prisma'
import { Locker, LockerType, LockerSize, LockerAssignment, LockerAssignmentStatus } from '@prisma/client'

export interface CreateLockerData {
  branchId: string
  lockerNumber: string
  lockerType?: LockerType
  location?: string
  size?: LockerSize
  monthlyRate: number
}

export interface UpdateLockerData extends Partial<CreateLockerData> {
  id: string
  isActive?: boolean
}

export interface CreateLockerAssignmentData {
  lockerId: string
  memberId: string
  branchId: string
  startDate: Date
  endDate: Date
  monthlyRate: number
  securityDeposit?: number
  keyNumber?: string
  notes?: string
}

export interface LockerFilters {
  branchId?: string
  lockerType?: LockerType
  size?: LockerSize
  isOccupied?: boolean
  location?: string
  search?: string
}

export class LockerService {
  static async createLocker(data: CreateLockerData, tenantId: string): Promise<Locker> {
    return await prisma.locker.create({
      data: {
        ...data,
        tenantId,
        lockerType: data.lockerType || 'STANDARD',
        size: data.size || 'MEDIUM',
        isActive: true,
        isOccupied: false,
      },
    })
  }

  static async updateLocker(data: UpdateLockerData): Promise<Locker> {
    const { id, ...updateData } = data
    return await prisma.locker.update({
      where: { id },
      data: updateData,
    })
  }

  static async deleteLocker(id: string): Promise<void> {
    await prisma.locker.update({
      where: { id },
      data: { isActive: false },
    })
  }

  static async getLocker(id: string) {
    return await prisma.locker.findUnique({
      where: { id },
      include: {
        branch: true,
        assignments: {
          where: { status: 'ACTIVE' },
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                membershipId: true,
                phone: true,
              },
            },
          },
        },
      },
    })
  }

  static async getLockers(filters: LockerFilters = {}, page = 1, limit = 50) {
    const where: any = {}

    if (filters.branchId) {
      where.branchId = filters.branchId
    }

    if (filters.lockerType) {
      where.lockerType = filters.lockerType
    }

    if (filters.size) {
      where.size = filters.size
    }

    if (filters.isOccupied !== undefined) {
      where.isOccupied = filters.isOccupied
    }

    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' }
    }

    if (filters.search) {
      where.OR = [
        { lockerNumber: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [lockers, total] = await Promise.all([
      prisma.locker.findMany({
        where,
        include: {
          assignments: {
            where: { status: 'ACTIVE' },
            include: {
              member: {
                select: {
                  firstName: true,
                  lastName: true,
                  membershipId: true,
                },
              },
            },
          },
        },
        orderBy: [
          { location: 'asc' },
          { lockerNumber: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.locker.count({ where }),
    ])

    return {
      lockers,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  static async assignLocker(data: CreateLockerAssignmentData, tenantId: string) {
    const locker = await prisma.locker.findUnique({
      where: { id: data.lockerId },
    })

    if (!locker) {
      throw new Error('Locker not found')
    }

    if (locker.isOccupied) {
      throw new Error('Locker is already occupied')
    }

    const member = await prisma.member.findUnique({
      where: { id: data.memberId },
    })

    if (!member) {
      throw new Error('Member not found')
    }

    // Check if member already has an active locker
    const existingAssignment = await prisma.lockerAssignment.findFirst({
      where: {
        memberId: data.memberId,
        status: 'ACTIVE',
      },
    })

    if (existingAssignment) {
      throw new Error('Member already has an active locker assignment')
    }

    // Generate invoice number for locker rental
    const invoiceCount = await prisma.invoice.count({
      where: { branchId: data.branchId }
    })
    const invoiceNumber = `INV-${data.branchId.slice(-4).toUpperCase()}-${String(invoiceCount + 1).padStart(4, '0')}`

    const result = await prisma.$transaction(async (tx) => {
      // Create locker assignment
      const assignment = await tx.lockerAssignment.create({
        data: {
          ...data,
          tenantId,
          status: 'ACTIVE',
        },
      })

      // Update locker status
      await tx.locker.update({
        where: { id: data.lockerId },
        data: { isOccupied: true },
      })

      // Create invoice for locker rental
      const totalAmount = Number(data.monthlyRate) + Number(data.securityDeposit || 0)
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          branchId: data.branchId,
          invoiceNumber,
          memberId: data.memberId,
          lockerAssignmentId: assignment.id,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          subtotal: totalAmount,
          totalAmount,
          status: 'DRAFT',
          notes: `Locker rental: ${locker.lockerNumber} (${data.startDate.toLocaleDateString()} - ${data.endDate.toLocaleDateString()})`,
        },
      })

      return { assignment, invoice }
    })

    return result
  }

  static async unassignLocker(assignmentId: string, reason?: string) {
    const assignment = await prisma.lockerAssignment.findUnique({
      where: { id: assignmentId },
      include: { locker: true },
    })

    if (!assignment) {
      throw new Error('Locker assignment not found')
    }

    await prisma.$transaction(async (tx) => {
      // Update assignment status
      await tx.lockerAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'TERMINATED',
          notes: assignment.notes ? `${assignment.notes}\nTerminated: ${reason || 'No reason provided'}` : `Terminated: ${reason || 'No reason provided'}`,
        },
      })

      // Update locker status
      await tx.locker.update({
        where: { id: assignment.lockerId },
        data: { isOccupied: false },
      })
    })
  }

  static async getLockerStats(branchId?: string) {
    const where = branchId ? { branchId } : {}

    const [
      totalLockers,
      occupiedLockers,
      availableLockers,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.locker.count({ where: { ...where, isActive: true } }),
      prisma.locker.count({ where: { ...where, isActive: true, isOccupied: true } }),
      prisma.locker.count({ where: { ...where, isActive: true, isOccupied: false } }),
      prisma.lockerAssignment.aggregate({
        where: {
          ...where,
          status: 'ACTIVE',
        },
        _sum: { monthlyRate: true },
      }),
    ])

    return {
      totalLockers,
      occupiedLockers,
      availableLockers,
      occupancyRate: totalLockers > 0 ? (occupiedLockers / totalLockers) * 100 : 0,
      monthlyRevenue: Number(monthlyRevenue._sum.monthlyRate || 0),
    }
  }

  static async getExpiringAssignments(branchId: string, daysAhead = 30) {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    return await prisma.lockerAssignment.findMany({
      where: {
        branchId,
        status: 'ACTIVE',
        endDate: {
          lte: futureDate,
        },
      },
      include: {
        locker: true,
        member: {
          select: {
            firstName: true,
            lastName: true,
            membershipId: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { endDate: 'asc' },
    })
  }
}