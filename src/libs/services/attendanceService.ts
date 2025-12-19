import { prisma } from '@/lib/prisma'
import { AttendanceRecord, StaffAttendance, EntryMethod, ShiftType } from '@prisma/client'

export interface CheckInData {
  memberId?: string
  userId?: string
  branchId: string
  entryMethod?: EntryMethod
  shiftType?: ShiftType
  roomId?: string
  notes?: string
}

export interface AttendanceFilters {
  branchId?: string
  memberId?: string
  userId?: string
  startDate?: Date
  endDate?: Date
  entryMethod?: EntryMethod
}

export class AttendanceService {
  // Member Attendance
  static async memberCheckIn(data: CheckInData): Promise<AttendanceRecord> {
    if (!data.memberId) {
      throw new Error('Member ID is required for member check-in')
    }

    // Check if member has active membership
    const member = await prisma.member.findUnique({
      where: { id: data.memberId },
      include: {
        memberships: {
          where: {
            status: 'ACTIVE',
            endDate: { gte: new Date() },
          },
          take: 1,
        },
      },
    })

    if (!member) {
      throw new Error('Member not found')
    }

    if (member.status !== 'ACTIVE' || member.memberships.length === 0) {
      throw new Error('Member does not have an active membership')
    }

    // Check if already checked in today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingCheckIn = await prisma.attendanceRecord.findFirst({
      where: {
        memberId: data.memberId,
        checkInTime: {
          gte: today,
          lt: tomorrow,
        },
        checkOutTime: null,
      },
    })

    if (existingCheckIn) {
      throw new Error('Member is already checked in')
    }

    return await prisma.attendanceRecord.create({
      data: {
        tenantId: member.tenantId,
        memberId: data.memberId,
        branchId: data.branchId,
        entryMethod: data.entryMethod || 'MANUAL',
        roomId: data.roomId,
        notes: data.notes,
      },
    })
  }

  static async memberCheckOut(attendanceId: string): Promise<AttendanceRecord> {
    const attendance = await prisma.attendanceRecord.findUnique({
      where: { id: attendanceId },
    })

    if (!attendance) {
      throw new Error('Attendance record not found')
    }

    if (attendance.checkOutTime) {
      throw new Error('Member is already checked out')
    }

    const checkOutTime = new Date()
    const duration = Math.floor((checkOutTime.getTime() - attendance.checkInTime.getTime()) / (1000 * 60))

    return await prisma.attendanceRecord.update({
      where: { id: attendanceId },
      data: {
        checkOutTime,
        duration,
      },
    })
  }

  // Staff Attendance
  static async staffCheckIn(data: CheckInData): Promise<StaffAttendance> {
    if (!data.userId) {
      throw new Error('User ID is required for staff check-in')
    }

    // Check if already checked in today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingCheckIn = await prisma.staffAttendance.findFirst({
      where: {
        userId: data.userId,
        checkInTime: {
          gte: today,
          lt: tomorrow,
        },
        checkOutTime: null,
      },
    })

    if (existingCheckIn) {
      throw new Error('Staff member is already checked in')
    }

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return await prisma.staffAttendance.create({
      data: {
        tenantId: user.tenantId,
        userId: data.userId,
        branchId: data.branchId,
        shiftType: data.shiftType || 'REGULAR',
        notes: data.notes,
      },
    })
  }

  static async staffCheckOut(attendanceId: string): Promise<StaffAttendance> {
    const attendance = await prisma.staffAttendance.findUnique({
      where: { id: attendanceId },
    })

    if (!attendance) {
      throw new Error('Staff attendance record not found')
    }

    if (attendance.checkOutTime) {
      throw new Error('Staff member is already checked out')
    }

    const checkOutTime = new Date()
    const duration = Math.floor((checkOutTime.getTime() - attendance.checkInTime.getTime()) / (1000 * 60))

    return await prisma.staffAttendance.update({
      where: { id: attendanceId },
      data: {
        checkOutTime,
        duration,
      },
    })
  }

  // Get Attendance Records
  static async getMemberAttendance(filters: AttendanceFilters = {}, page = 1, limit = 20) {
    const where: any = {}

    if (filters.branchId) {
      where.branchId = filters.branchId
    }

    if (filters.memberId) {
      where.memberId = filters.memberId
    }

    if (filters.startDate && filters.endDate) {
      where.checkInTime = {
        gte: filters.startDate,
        lte: filters.endDate,
      }
    }

    if (filters.entryMethod) {
      where.entryMethod = filters.entryMethod
    }

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              membershipId: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          room: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { checkInTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.attendanceRecord.count({ where }),
    ])

    return {
      records,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  static async getStaffAttendance(filters: AttendanceFilters = {}, page = 1, limit = 20) {
    const where: any = {}

    if (filters.branchId) {
      where.branchId = filters.branchId
    }

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.startDate && filters.endDate) {
      where.checkInTime = {
        gte: filters.startDate,
        lte: filters.endDate,
      }
    }

    const [records, total] = await Promise.all([
      prisma.staffAttendance.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { checkInTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.staffAttendance.count({ where }),
    ])

    return {
      records,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  // Get Current Check-ins
  static async getCurrentMemberCheckIns(branchId: string) {
    return await prisma.attendanceRecord.findMany({
      where: {
        branchId,
        checkOutTime: null,
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            membershipId: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { checkInTime: 'desc' },
    })
  }

  static async getCurrentStaffCheckIns(branchId: string) {
    return await prisma.staffAttendance.findMany({
      where: {
        branchId,
        checkOutTime: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { checkInTime: 'desc' },
    })
  }

  // Attendance Statistics
  static async getAttendanceStats(branchId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {}
    const staffWhere: any = {}

    if (branchId) {
      where.branchId = branchId
      staffWhere.branchId = branchId
    }

    if (startDate && endDate) {
      where.checkInTime = { gte: startDate, lte: endDate }
      staffWhere.checkInTime = { gte: startDate, lte: endDate }
    }

    const [
      totalMemberVisits,
      uniqueMembers,
      averageDuration,
      totalStaffHours,
      currentCheckIns,
    ] = await Promise.all([
      prisma.attendanceRecord.count({ where }),
      prisma.attendanceRecord.findMany({
        where,
        select: { memberId: true },
        distinct: ['memberId'],
      }),
      prisma.attendanceRecord.aggregate({
        where: { ...where, duration: { not: null } },
        _avg: { duration: true },
      }),
      prisma.staffAttendance.aggregate({
        where: { ...staffWhere, duration: { not: null } },
        _sum: { duration: true },
      }),
      branchId ? prisma.attendanceRecord.count({
        where: { branchId, checkOutTime: null },
      }) : 0,
    ])

    return {
      totalMemberVisits,
      uniqueMembers: uniqueMembers.length,
      averageDuration: averageDuration._avg.duration || 0,
      totalStaffHours: (totalStaffHours._sum.duration || 0) / 60, // Convert to hours
      currentCheckIns,
    }
  }

  // Daily Attendance Report
  static async getDailyAttendanceReport(branchId: string, date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const [memberAttendance, staffAttendance] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: {
          branchId,
          checkInTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          member: {
            select: {
              firstName: true,
              lastName: true,
              membershipId: true,
            },
          },
          room: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { checkInTime: 'asc' },
      }),
      prisma.staffAttendance.findMany({
        where: {
          branchId,
          checkInTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { checkInTime: 'asc' },
      }),
    ])

    return {
      date,
      memberAttendance,
      staffAttendance,
      totalMemberVisits: memberAttendance.length,
      totalStaffPresent: staffAttendance.length,
    }
  }

  // Member Check-in by ID or Phone
  static async findMemberForCheckIn(branchId: string, identifier: string) {
    return await prisma.member.findFirst({
      where: {
        branchId,
        OR: [
          { membershipId: identifier },
          { phone: identifier },
          { email: identifier },
        ],
        status: 'ACTIVE',
      },
      include: {
        memberships: {
          where: {
            status: 'ACTIVE',
            endDate: { gte: new Date() },
          },
          include: {
            plan: {
              select: {
                name: true,
                gymAccess: true,
              },
            },
          },
          take: 1,
        },
      },
    })
  }
}