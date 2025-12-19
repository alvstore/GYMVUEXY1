import { prisma } from '@/lib/prisma'
import { Class, ClassSchedule, ClassBooking, ClassType, ClassDifficulty, ClassStatus, BookingStatus, BookingType, DayOfWeek } from '@prisma/client'

export interface CreateClassData {
  tenantId: string
  branchId: string
  trainerId?: string
  name: string
  description?: string
  classType: ClassType
  difficulty?: ClassDifficulty
  duration: number
  capacity: number
  price?: number
  isRecurring?: boolean
  recurringDays?: DayOfWeek[]
  startTime: string
  endTime: string
  roomId?: string
  imageUrl?: string
  requirements?: string
}

export interface CreateScheduleData {
  classId: string
  trainerId?: string
  scheduledDate: Date
  startTime?: string
  endTime?: string
  capacity?: number
  roomId?: string
  notes?: string
}

export interface BookClassData {
  scheduleId: string
  memberId: string
  bookingType?: BookingType
  notes?: string
}

export interface ClassFilters {
  branchId?: string
  trainerId?: string
  classType?: ClassType
  difficulty?: ClassDifficulty
  search?: string
  isActive?: boolean
}

export class EnhancedClassService {
  // Class Management
  static async createClass(data: CreateClassData): Promise<Class> {
    return await prisma.class.create({
      data: {
        ...data,
        difficulty: data.difficulty || 'BEGINNER',
        isRecurring: data.isRecurring || false,
        recurringDays: data.recurringDays || [],
      },
    })
  }

  static async updateClass(id: string, data: Partial<CreateClassData>): Promise<Class> {
    return await prisma.class.update({
      where: { id },
      data,
    })
  }

  static async deleteClass(id: string): Promise<void> {
    await prisma.class.update({
      where: { id },
      data: { isActive: false },
    })
  }

  static async getClass(id: string) {
    return await prisma.class.findUnique({
      where: { id },
      include: {
        trainer: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
        room: true,
        schedules: {
          where: {
            scheduledDate: { gte: new Date() },
          },
          include: {
            bookings: {
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
          orderBy: { scheduledDate: 'asc' },
          take: 10,
        },
        _count: {
          select: {
            bookings: {
              where: { status: 'CONFIRMED' },
            },
          },
        },
      },
    })
  }

  static async getClasses(filters: ClassFilters = {}, page = 1, limit = 20) {
    const where: any = {}

    if (filters.branchId) where.branchId = filters.branchId
    if (filters.trainerId) where.trainerId = filters.trainerId
    if (filters.classType) where.classType = filters.classType
    if (filters.difficulty) where.difficulty = filters.difficulty
    if (filters.isActive !== undefined) where.isActive = filters.isActive

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        include: {
          trainer: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          room: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              bookings: {
                where: { status: 'CONFIRMED' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.class.count({ where }),
    ])

    return {
      classes,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  // Schedule Management
  static async createSchedule(data: CreateScheduleData): Promise<ClassSchedule> {
    const classInfo = await prisma.class.findUnique({
      where: { id: data.classId },
    })

    if (!classInfo) {
      throw new Error('Class not found')
    }

    return await prisma.classSchedule.create({
      data: {
        tenantId: classInfo.tenantId,
        branchId: classInfo.branchId,
        classId: data.classId,
        trainerId: data.trainerId || classInfo.trainerId,
        scheduledDate: data.scheduledDate,
        startTime: data.startTime || classInfo.startTime,
        endTime: data.endTime || classInfo.endTime,
        capacity: data.capacity || classInfo.capacity,
        roomId: data.roomId || classInfo.roomId,
        notes: data.notes,
      },
    })
  }

  static async getSchedules(
    branchId?: string,
    startDate?: Date,
    endDate?: Date,
    trainerId?: string
  ) {
    const where: any = {}

    if (branchId) where.branchId = branchId
    if (trainerId) where.trainerId = trainerId

    if (startDate && endDate) {
      where.scheduledDate = {
        gte: startDate,
        lte: endDate,
      }
    }

    return await prisma.classSchedule.findMany({
      where,
      include: {
        class: true,
        trainer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        room: {
          select: {
            name: true,
          },
        },
        bookings: {
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
        { scheduledDate: 'asc' },
        { startTime: 'asc' },
      ],
    })
  }

  // Booking Management
  static async bookClass(data: BookClassData): Promise<ClassBooking> {
    const schedule = await prisma.classSchedule.findUnique({
      where: { id: data.scheduleId },
      include: {
        class: true,
        bookings: {
          where: { status: { in: ['CONFIRMED', 'WAITLISTED'] } },
        },
      },
    })

    if (!schedule) {
      throw new Error('Class schedule not found')
    }

    // Check if member already booked
    const existingBooking = await prisma.classBooking.findUnique({
      where: {
        scheduleId_memberId: {
          scheduleId: data.scheduleId,
          memberId: data.memberId,
        },
      },
    })

    if (existingBooking) {
      throw new Error('Member already booked for this class')
    }

    // Check member's active membership and class access
    const member = await prisma.member.findUnique({
      where: { id: data.memberId },
      include: {
        memberships: {
          where: {
            status: 'ACTIVE',
            endDate: { gte: new Date() },
          },
          include: {
            plan: true,
          },
        },
      },
    })

    if (!member || member.memberships.length === 0) {
      throw new Error('Member does not have an active membership')
    }

    const activeMembership = member.memberships[0]
    if (!activeMembership.plan.groupClasses && schedule.class.price && schedule.class.price > 0) {
      throw new Error('Member\'s plan does not include group classes')
    }

    // Check capacity
    const confirmedBookings = schedule.bookings.filter(b => b.status === 'CONFIRMED').length
    let bookingStatus: BookingStatus = 'CONFIRMED'
    let waitlistPosition: number | undefined

    if (confirmedBookings >= schedule.capacity) {
      bookingStatus = 'WAITLISTED'
      const waitlistBookings = schedule.bookings.filter(b => b.status === 'WAITLISTED').length
      waitlistPosition = waitlistBookings + 1
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create booking
      const booking = await tx.classBooking.create({
        data: {
          tenantId: schedule.tenantId,
          branchId: schedule.branchId,
          classId: schedule.classId,
          scheduleId: data.scheduleId,
          memberId: data.memberId,
          bookingType: data.bookingType || 'REGULAR',
          status: bookingStatus,
          waitlistPosition,
          notes: data.notes,
        },
      })

      // Update schedule booking count
      if (bookingStatus === 'CONFIRMED') {
        await tx.classSchedule.update({
          where: { id: data.scheduleId },
          data: { bookedCount: { increment: 1 } },
        })
      } else {
        await tx.classSchedule.update({
          where: { id: data.scheduleId },
          data: { waitlistCount: { increment: 1 } },
        })
      }

      // Create invoice for paid classes
      if (schedule.class.price && schedule.class.price > 0 && data.bookingType !== 'COMPLIMENTARY') {
        const invoiceCount = await tx.invoice.count({
          where: { branchId: schedule.branchId }
        })
        const invoiceNumber = `INV-${schedule.branchId.slice(-4).toUpperCase()}-${String(invoiceCount + 1).padStart(4, '0')}`

        await tx.invoice.create({
          data: {
            tenantId: schedule.tenantId,
            branchId: schedule.branchId,
            invoiceNumber,
            memberId: data.memberId,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            subtotal: schedule.class.price,
            totalAmount: schedule.class.price,
            status: 'DRAFT',
            notes: `Class booking: ${schedule.class.name} - ${schedule.scheduledDate.toLocaleDateString()}`,
          },
        })
      }

      return booking
    })

    return result
  }

  static async cancelBooking(bookingId: string, reason?: string): Promise<ClassBooking> {
    const booking = await prisma.classBooking.findUnique({
      where: { id: bookingId },
      include: { schedule: true },
    })

    if (!booking) {
      throw new Error('Booking not found')
    }

    if (booking.status === 'CANCELLED') {
      throw new Error('Booking is already cancelled')
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update booking
      const updatedBooking = await tx.classBooking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
      })

      // Update schedule counts
      if (booking.status === 'CONFIRMED') {
        await tx.classSchedule.update({
          where: { id: booking.scheduleId! },
          data: { bookedCount: { decrement: 1 } },
        })

        // Promote waitlisted member
        const nextWaitlisted = await tx.classBooking.findFirst({
          where: {
            scheduleId: booking.scheduleId,
            status: 'WAITLISTED',
          },
          orderBy: { waitlistPosition: 'asc' },
        })

        if (nextWaitlisted) {
          await tx.classBooking.update({
            where: { id: nextWaitlisted.id },
            data: {
              status: 'CONFIRMED',
              waitlistPosition: null,
            },
          })

          await tx.classSchedule.update({
            where: { id: booking.scheduleId! },
            data: {
              bookedCount: { increment: 1 },
              waitlistCount: { decrement: 1 },
            },
          })

          // Send notification to promoted member
          // This would integrate with the communication service
        }
      } else if (booking.status === 'WAITLISTED') {
        await tx.classSchedule.update({
          where: { id: booking.scheduleId! },
          data: { waitlistCount: { decrement: 1 } },
        })
      }

      return updatedBooking
    })

    return result
  }

  static async markAttendance(bookingId: string): Promise<ClassBooking> {
    const booking = await prisma.classBooking.findUnique({
      where: { id: bookingId },
      include: {
        schedule: {
          include: {
            class: true,
          },
        },
        member: true,
      },
    })

    if (!booking) {
      throw new Error('Booking not found')
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update booking
      const updatedBooking = await tx.classBooking.update({
        where: { id: bookingId },
        data: {
          status: 'ATTENDED',
          attendedAt: new Date(),
        },
      })

      // Create attendance record
      await tx.attendanceRecord.create({
        data: {
          tenantId: booking.tenantId,
          branchId: booking.branchId,
          memberId: booking.memberId,
          entryMethod: 'MANUAL',
          roomId: booking.schedule?.roomId,
          notes: `Class attendance: ${booking.schedule?.class?.name}`,
        },
      })

      return updatedBooking
    })

    return result
  }

  // Generate recurring schedules
  static async generateRecurringSchedules(classId: string, startDate: Date, endDate: Date) {
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
    })

    if (!classInfo || !classInfo.isRecurring) {
      throw new Error('Class is not set for recurring schedules')
    }

    const schedules = []
    const current = new Date(startDate)

    while (current <= endDate) {
      const dayOfWeek = this.getDayOfWeek(current.getDay())
      
      if (classInfo.recurringDays.includes(dayOfWeek)) {
        // Check if schedule already exists
        const existingSchedule = await prisma.classSchedule.findFirst({
          where: {
            classId,
            scheduledDate: {
              gte: new Date(current.getFullYear(), current.getMonth(), current.getDate()),
              lt: new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1),
            },
          },
        })

        if (!existingSchedule) {
          const schedule = await prisma.classSchedule.create({
            data: {
              tenantId: classInfo.tenantId,
              branchId: classInfo.branchId,
              classId,
              trainerId: classInfo.trainerId,
              scheduledDate: new Date(current),
              startTime: classInfo.startTime,
              endTime: classInfo.endTime,
              capacity: classInfo.capacity,
              roomId: classInfo.roomId,
            },
          })
          schedules.push(schedule)
        }
      }

      current.setDate(current.getDate() + 1)
    }

    return schedules
  }

  // Analytics
  static async getClassStats(branchId?: string, trainerId?: string) {
    const where: any = {}
    if (branchId) where.branchId = branchId
    if (trainerId) where.trainerId = trainerId

    const [
      totalClasses,
      activeClasses,
      totalBookings,
      attendanceRate,
      popularClasses,
      revenueByClass,
    ] = await Promise.all([
      prisma.class.count({ where }),
      prisma.class.count({ where: { ...where, isActive: true } }),
      prisma.classBooking.count({
        where: {
          class: where,
          status: { in: ['CONFIRMED', 'ATTENDED'] },
        },
      }),
      this.calculateAttendanceRate(where),
      this.getPopularClasses(where),
      this.getRevenueByClass(where),
    ])

    return {
      totalClasses,
      activeClasses,
      totalBookings,
      attendanceRate,
      popularClasses,
      revenueByClass,
    }
  }

  static async getUpcomingClasses(branchId: string, memberId?: string, limit = 10) {
    const where: any = {
      branchId,
      scheduledDate: { gte: new Date() },
      status: 'SCHEDULED',
    }

    return await prisma.classSchedule.findMany({
      where,
      include: {
        class: true,
        trainer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        room: {
          select: {
            name: true,
          },
        },
        bookings: memberId ? {
          where: { memberId },
        } : {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { startTime: 'asc' },
      ],
      take: limit,
    })
  }

  static async getMemberBookings(memberId: string, status?: BookingStatus) {
    const where: any = { memberId }
    if (status) where.status = status

    return await prisma.classBooking.findMany({
      where,
      include: {
        class: true,
        schedule: {
          include: {
            trainer: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            room: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { bookedAt: 'desc' },
    })
  }

  // Calendar Integration
  static async getCalendarEvents(branchId: string, startDate: Date, endDate: Date, userId?: string) {
    const schedules = await this.getSchedules(branchId, startDate, endDate)
    
    return schedules.map(schedule => ({
      id: schedule.id,
      title: schedule.class.name,
      start: new Date(`${schedule.scheduledDate.toISOString().split('T')[0]}T${schedule.startTime}`),
      end: new Date(`${schedule.scheduledDate.toISOString().split('T')[0]}T${schedule.endTime}`),
      extendedProps: {
        classType: schedule.class.classType,
        trainer: schedule.trainer?.user.name,
        room: schedule.room?.name,
        capacity: schedule.capacity,
        booked: schedule.bookedCount,
        waitlist: schedule.waitlistCount,
        status: schedule.status,
      },
    }))
  }

  // Waitlist Management
  static async promoteFromWaitlist(scheduleId: string) {
    const nextWaitlisted = await prisma.classBooking.findFirst({
      where: {
        scheduleId,
        status: 'WAITLISTED',
      },
      orderBy: { waitlistPosition: 'asc' },
      include: {
        member: true,
        schedule: {
          include: {
            class: true,
          },
        },
      },
    })

    if (!nextWaitlisted) {
      return null
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updatedBooking = await tx.classBooking.update({
        where: { id: nextWaitlisted.id },
        data: {
          status: 'CONFIRMED',
          waitlistPosition: null,
        },
      })

      // Update schedule counts
      await tx.classSchedule.update({
        where: { id: scheduleId },
        data: {
          bookedCount: { increment: 1 },
          waitlistCount: { decrement: 1 },
        },
      })

      return updatedBooking
    })

    // Send notification to member about promotion
    // This would integrate with the communication service

    return result
  }

  // Helper methods
  private static async calculateAttendanceRate(where: any): Promise<number> {
    const totalBookings = await prisma.classBooking.count({
      where: {
        class: where,
        status: { in: ['CONFIRMED', 'ATTENDED', 'NO_SHOW'] },
      },
    })

    const attendedBookings = await prisma.classBooking.count({
      where: {
        class: where,
        status: 'ATTENDED',
      },
    })

    return totalBookings > 0 ? (attendedBookings / totalBookings) * 100 : 0
  }

  private static async getPopularClasses(where: any, limit = 5) {
    return await prisma.class.findMany({
      where,
      include: {
        _count: {
          select: {
            bookings: {
              where: { status: { in: ['CONFIRMED', 'ATTENDED'] } },
            },
          },
        },
      },
      orderBy: {
        bookings: {
          _count: 'desc',
        },
      },
      take: limit,
    })
  }

  private static async getRevenueByClass(where: any) {
    const classes = await prisma.class.findMany({
      where: { ...where, price: { gt: 0 } },
      include: {
        bookings: {
          where: { status: { in: ['CONFIRMED', 'ATTENDED'] } },
        },
      },
    })

    return classes.map(classItem => ({
      className: classItem.name,
      bookings: classItem.bookings.length,
      revenue: Number(classItem.price || 0) * classItem.bookings.length,
    }))
  }

  private static getDayOfWeek(dayIndex: number): DayOfWeek {
    const days: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    return days[dayIndex]
  }

  // Bulk Operations
  static async bulkScheduleGeneration(classIds: string[], startDate: Date, endDate: Date) {
    const results = []
    
    for (const classId of classIds) {
      try {
        const schedules = await this.generateRecurringSchedules(classId, startDate, endDate)
        results.push({ classId, schedules: schedules.length, success: true })
      } catch (error) {
        results.push({ classId, error: error.message, success: false })
      }
    }

    return results
  }

  // Class Capacity Analytics
  static async getCapacityAnalytics(branchId: string, startDate?: Date, endDate?: Date) {
    const where: any = { branchId }
    if (startDate && endDate) {
      where.scheduledDate = { gte: startDate, lte: endDate }
    }

    const schedules = await prisma.classSchedule.findMany({
      where,
      include: {
        class: {
          select: {
            name: true,
            classType: true,
          },
        },
      },
    })

    const analytics = schedules.map(schedule => ({
      className: schedule.class.name,
      classType: schedule.class.classType,
      date: schedule.scheduledDate,
      capacity: schedule.capacity,
      booked: schedule.bookedCount,
      waitlist: schedule.waitlistCount,
      utilizationRate: (schedule.bookedCount / schedule.capacity) * 100,
    }))

    return analytics
  }
}