import { prisma } from '@/lib/prisma'
import { TrainerProfile, TrainerStatus, TrainerSpecialization, SessionType, AssignmentStatus, DayOfWeek, SessionStatus } from '@prisma/client'

export interface CreateTrainerData {
  userId: string
  branchId: string
  bio?: string
  experience?: number
  certifications?: string[]
  specializations?: TrainerSpecialization[]
  languages?: string[]
}

export interface UpdateTrainerData extends Partial<CreateTrainerData> {
  id: string
  status?: TrainerStatus
}

export interface TrainerAvailabilityData {
  trainerId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
}

export interface TrainerRateData {
  trainerId: string
  sessionType: SessionType
  duration: number
  rate: number
}

export interface CreateAssignmentData {
  memberId: string
  trainerId: string
  branchId: string
  sessionType: SessionType
  totalSessions: number
  rate: number
  startDate: Date
  endDate?: Date
  notes?: string
  requestedBy?: string
}

export interface TrainerFilters {
  branchId?: string
  specialization?: TrainerSpecialization
  status?: TrainerStatus
  search?: string
  availableOn?: DayOfWeek
}

export interface ScheduleSessionData {
  assignmentId: string
  scheduledDate: Date
  startTime: string
  endTime: string
  roomId?: string
  notes?: string
}

export class TrainerService {
  static async createTrainer(data: CreateTrainerData, tenantId: string): Promise<TrainerProfile> {
    // Verify user exists and has trainer role
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: {
        roleAssignments: {
          include: { role: true },
        },
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const hasTrainerRole = user.roleAssignments.some(ra => ra.role.name === 'trainer')
    if (!hasTrainerRole) {
      throw new Error('User must have trainer role')
    }

    return await prisma.trainerProfile.create({
      data: {
        ...data,
        tenantId,
        certifications: data.certifications || [],
        specializations: data.specializations || [],
        languages: data.languages || [],
        status: 'ACTIVE',
      },
    })
  }

  static async updateTrainer(data: UpdateTrainerData): Promise<TrainerProfile> {
    const { id, ...updateData } = data
    return await prisma.trainerProfile.update({
      where: { id },
      data: updateData,
    })
  }

  static async deleteTrainer(id: string): Promise<void> {
    await prisma.trainerProfile.update({
      where: { id },
      data: { status: 'INACTIVE' },
    })
  }

  static async getTrainer(id: string) {
    return await prisma.trainerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        branch: true,
        availability: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' },
        },
        rates: {
          where: { isActive: true },
          orderBy: { sessionType: 'asc' },
        },
        assignments: {
          where: { status: 'ACTIVE' },
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                membershipId: true,
              },
            },
          },
        },
        sessions: {
          where: {
            scheduledDate: { gte: new Date() },
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
          orderBy: { scheduledDate: 'asc' },
          take: 10,
        },
        reviews: {
          include: {
            member: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            assignments: {
              where: { status: 'ACTIVE' },
            },
            sessions: {
              where: { status: 'COMPLETED' },
            },
          },
        },
      },
    })
  }

  static async getTrainers(filters: TrainerFilters = {}, page = 1, limit = 20) {
    const where: any = {}

    if (filters.branchId) {
      where.branchId = filters.branchId
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.specialization) {
      where.specializations = {
        has: filters.specialization,
      }
    }

    if (filters.search) {
      where.OR = [
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
        { bio: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.availableOn) {
      where.availability = {
        some: {
          dayOfWeek: filters.availableOn,
          isActive: true,
        },
      }
    }

    const [trainers, total] = await Promise.all([
      prisma.trainerProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          availability: {
            where: { isActive: true },
          },
          rates: {
            where: { isActive: true },
            orderBy: { rate: 'asc' },
            take: 1,
          },
          _count: {
            select: {
              assignments: {
                where: { status: 'ACTIVE' },
              },
              sessions: {
                where: { status: 'COMPLETED' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.trainerProfile.count({ where }),
    ])

    return {
      trainers,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  static async setAvailability(trainerId: string, availability: Omit<TrainerAvailabilityData, 'trainerId'>[]) {
    // Clear existing availability
    await prisma.trainerAvailability.deleteMany({
      where: { trainerId },
    })

    // Create new availability
    const availabilityData = availability.map(slot => ({
      ...slot,
      trainerId,
    }))

    return await prisma.trainerAvailability.createMany({
      data: availabilityData,
    })
  }

  static async setRates(trainerId: string, rates: Omit<TrainerRateData, 'trainerId'>[]) {
    // Deactivate existing rates
    await prisma.trainerRate.updateMany({
      where: { trainerId },
      data: { isActive: false },
    })

    // Create new rates
    for (const rate of rates) {
      await prisma.trainerRate.upsert({
        where: {
          trainerId_sessionType_duration: {
            trainerId,
            sessionType: rate.sessionType,
            duration: rate.duration,
          },
        },
        update: {
          rate: rate.rate,
          isActive: true,
        },
        create: {
          ...rate,
          trainerId,
          isActive: true,
        },
      })
    }
  }

  static async createAssignment(data: CreateAssignmentData, tenantId: string) {
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: data.trainerId },
      include: { user: true },
    })

    if (!trainer) {
      throw new Error('Trainer not found')
    }

    const member = await prisma.member.findUnique({
      where: { id: data.memberId },
    })

    if (!member) {
      throw new Error('Member not found')
    }

    // Calculate total amount and revenue split
    const totalAmount = data.rate * data.totalSessions
    const trainerShare = totalAmount * 0.7 // 70% to trainer
    const adminShare = totalAmount * 0.3   // 30% to admin

    const result = await prisma.$transaction(async (tx) => {
      // Create assignment
      const assignment = await tx.trainerAssignment.create({
        data: {
          ...data,
          tenantId,
          status: 'PENDING',
          trainerShare,
          adminShare,
        },
      })

      // Create invoice
      const invoiceCount = await tx.invoice.count({
        where: { branchId: data.branchId }
      })
      const invoiceNumber = `INV-${data.branchId.slice(-4).toUpperCase()}-${String(invoiceCount + 1).padStart(4, '0')}`

      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          branchId: data.branchId,
          invoiceNumber,
          memberId: data.memberId,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          subtotal: totalAmount,
          totalAmount,
          status: 'DRAFT',
          notes: `Personal Training: ${data.totalSessions} sessions with ${trainer.user?.name}`,
        },
      })

      // Link invoice to assignment
      await tx.trainerAssignment.update({
        where: { id: assignment.id },
        data: { invoiceId: invoice.id },
      })

      return { assignment, invoice }
    })

    return result
  }

  static async approveAssignment(assignmentId: string, approvedBy: string) {
    return await prisma.trainerAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'ACTIVE',
        approvedBy,
        approvedAt: new Date(),
      },
    })
  }

  static async declineAssignment(assignmentId: string, reason?: string) {
    return await prisma.trainerAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'CANCELLED',
        notes: reason ? `Declined: ${reason}` : 'Declined by trainer',
      },
    })
  }

  static async findOptimalTrainer(branchId: string, sessionType: SessionType, preferredTime?: string, preferredDay?: DayOfWeek) {
    // Get all active trainers in the branch
    const trainers = await prisma.trainerProfile.findMany({
      where: {
        branchId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        rates: {
          where: {
            sessionType,
            isActive: true,
          },
        },
        availability: {
          where: {
            isActive: true,
            ...(preferredDay && { dayOfWeek: preferredDay }),
          },
        },
        _count: {
          select: {
            assignments: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    })

    if (trainers.length === 0) {
      throw new Error('No available trainers found')
    }

    // Filter trainers with rates for the session type
    const availableTrainers = trainers.filter(t => t.rates.length > 0)

    if (availableTrainers.length === 0) {
      throw new Error('No trainers available for this session type')
    }

    // Sort by utilization (lowest first), then by rating
    const sortedTrainers = availableTrainers.sort((a, b) => {
      const utilizationA = a._count.assignments
      const utilizationB = b._count.assignments
      
      if (utilizationA !== utilizationB) {
        return utilizationA - utilizationB
      }
      
      return (b.rating || 0) - (a.rating || 0)
    })

    return sortedTrainers[0]
  }

  static async scheduleSession(data: ScheduleSessionData) {
    const assignment = await prisma.trainerAssignment.findUnique({
      where: { id: data.assignmentId },
    })

    if (!assignment) {
      throw new Error('Assignment not found')
    }

    if (assignment.status !== 'ACTIVE') {
      throw new Error('Assignment is not active')
    }

    return await prisma.trainingSession.create({
      data: {
        assignmentId: data.assignmentId,
        trainerId: assignment.trainerId,
        memberId: assignment.memberId,
        branchId: assignment.branchId,
        scheduledDate: data.scheduledDate,
        startTime: data.startTime,
        endTime: data.endTime,
        sessionType: assignment.sessionType,
        rate: assignment.rate,
        roomId: data.roomId,
        status: 'SCHEDULED',
      },
    })
  }

  static async updateSessionStatus(sessionId: string, status: SessionStatus, notes?: string) {
    const updateData: any = { status }

    if (status === 'IN_PROGRESS') {
      updateData.actualStartTime = new Date()
    } else if (status === 'COMPLETED') {
      updateData.actualEndTime = new Date()
    }

    if (notes) {
      updateData.trainerNotes = notes
    }

    const session = await prisma.trainingSession.update({
      where: { id: sessionId },
      data: updateData,
    })

    // Update trainer's total sessions and assignment progress
    if (status === 'COMPLETED') {
      await prisma.trainerProfile.update({
        where: { id: session.trainerId },
        data: {
          totalSessions: { increment: 1 },
        },
      })

      await prisma.trainerAssignment.update({
        where: { id: session.assignmentId },
        data: {
          completedSessions: { increment: 1 },
        },
      })
    }

    return session
  }

  static async addTrainerReview(data: {
    trainerId: string
    memberId: string
    sessionId?: string
    rating: number
    review?: string
    isAnonymous?: boolean
  }) {
    // Check if review already exists for this combination
    const existingReview = await prisma.trainerReview.findUnique({
      where: {
        trainerId_memberId_sessionId: {
          trainerId: data.trainerId,
          memberId: data.memberId,
          sessionId: data.sessionId || '',
        },
      },
    })

    if (existingReview) {
      throw new Error('Review already exists for this session')
    }

    const review = await prisma.trainerReview.create({
      data,
    })

    // Update trainer's average rating
    const reviews = await prisma.trainerReview.findMany({
      where: { trainerId: data.trainerId },
    })

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

    await prisma.trainerProfile.update({
      where: { id: data.trainerId },
      data: { rating: averageRating },
    })

    return review
  }

  static async getTrainerStats(trainerId?: string, branchId?: string) {
    const where: any = {}

    if (trainerId) {
      where.id = trainerId
    }

    if (branchId) {
      where.branchId = branchId
    }

    const [
      totalTrainers,
      activeTrainers,
      totalAssignments,
      completedSessions,
      averageRating,
    ] = await Promise.all([
      prisma.trainerProfile.count({ where }),
      prisma.trainerProfile.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.trainerAssignment.count({
        where: {
          trainer: where,
          status: 'ACTIVE',
        },
      }),
      prisma.trainingSession.count({
        where: {
          trainer: where,
          status: 'COMPLETED',
        },
      }),
      prisma.trainerProfile.aggregate({
        where,
        _avg: { rating: true },
      }),
    ])

    return {
      totalTrainers,
      activeTrainers,
      totalAssignments,
      completedSessions,
      averageRating: averageRating._avg.rating || 0,
    }
  }

  static async getTrainerUtilization(branchId: string) {
    return await prisma.trainerProfile.findMany({
      where: { branchId, status: 'ACTIVE' },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            assignments: {
              where: { status: 'ACTIVE' },
            },
            sessions: {
              where: {
                status: 'COMPLETED',
                scheduledDate: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                },
              },
            },
          },
        },
      },
      orderBy: {
        assignments: {
          _count: 'asc',
        },
      },
    })
  }

  static async requestTrainerChange(assignmentId: string, newTrainerId: string, reason: string) {
    const assignment = await prisma.trainerAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        member: true,
        trainer: {
          include: { user: true },
        },
      },
    })

    if (!assignment) {
      throw new Error('Assignment not found')
    }

    // For now, we'll just update the assignment with a note
    // In a full implementation, this would create a change request ticket
    return await prisma.trainerAssignment.update({
      where: { id: assignmentId },
      data: {
        notes: `${assignment.notes || ''}\n\nChange request: ${reason} (Requested new trainer: ${newTrainerId})`,
      },
    })
  }

  static async getAssignments(filters: {
    trainerId?: string
    memberId?: string
    branchId?: string
    status?: AssignmentStatus
  } = {}) {
    return await prisma.trainerAssignment.findMany({
      where: filters,
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
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            membershipId: true,
            phone: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
        sessions: {
          where: { status: 'COMPLETED' },
        },
        _count: {
          select: {
            sessions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async getTrainerSessions(trainerId: string, startDate?: Date, endDate?: Date) {
    const where: any = { trainerId }

    if (startDate && endDate) {
      where.scheduledDate = {
        gte: startDate,
        lte: endDate,
      }
    }

    return await prisma.trainingSession.findMany({
      where,
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
        assignment: {
          select: {
            sessionType: true,
            totalSessions: true,
            completedSessions: true,
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    })
  }

  static async getTrainerRevenue(trainerId: string, startDate?: Date, endDate?: Date) {
    const where: any = { trainerId, status: 'COMPLETED' }

    if (startDate && endDate) {
      where.scheduledDate = {
        gte: startDate,
        lte: endDate,
      }
    }

    const sessions = await prisma.trainingSession.findMany({
      where,
      include: {
        assignment: true,
      },
    })

    const totalRevenue = sessions.reduce((sum, session) => sum + Number(session.rate), 0)
    const trainerRevenue = sessions.reduce((sum, session) => sum + Number(session.assignment.trainerShare || 0), 0)

    return {
      totalSessions: sessions.length,
      totalRevenue,
      trainerRevenue,
      adminRevenue: totalRevenue - trainerRevenue,
    }
  }
}