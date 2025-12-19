import { prisma } from '@/lib/prisma'
import { AccessResult, EntryMethod, AlertType, AlertSeverity, TemporaryAccessType } from '@prisma/client'

export interface AccessAttempt {
  branchId: string
  roomId: string
  deviceId: string
  memberId?: string
  userId?: string
  accessMethod: EntryMethod
  cardId?: string
  biometricId?: string
  ipAddress?: string
  userAgent?: string
}

export interface TemporaryAccessData {
  branchId: string
  roomId: string
  memberId?: string
  userId?: string
  guestName?: string
  guestPhone?: string
  accessType: TemporaryAccessType
  startTime: Date
  endTime: Date
  notes?: string
  createdBy: string
}

export class AccessControlService {
  // Validate access attempt
  static async validateAccess(attempt: AccessAttempt): Promise<{ granted: boolean; result: AccessResult; reason?: string }> {
    const { branchId, roomId, memberId, userId, accessMethod } = attempt

    try {
      // Check if room exists and is active
      const room = await prisma.room.findFirst({
        where: { id: roomId, branchId, isActive: true },
      })

      if (!room) {
        return { granted: false, result: 'DENIED_DEVICE_ERROR', reason: 'Room not found or inactive' }
      }

      // Member access validation
      if (memberId) {
        const member = await prisma.member.findFirst({
          where: { id: memberId, branchId },
          include: {
            memberships: {
              where: {
                status: 'ACTIVE',
                endDate: { gte: new Date() },
              },
              include: {
                plan: {
                  include: {
                    roomPermissions: {
                      where: { roomId, isActive: true },
                    },
                  },
                },
              },
            },
          },
        })

        if (!member) {
          return { granted: false, result: 'DENIED_INVALID_CREDENTIAL', reason: 'Member not found' }
        }

        if (member.status === 'SUSPENDED') {
          return { granted: false, result: 'DENIED_SUSPENDED_MEMBER', reason: 'Member account suspended' }
        }

        // Check if member has active membership
        const activeMembership = member.memberships.find(m => m.status === 'ACTIVE' && m.endDate >= new Date())
        if (!activeMembership) {
          return { granted: false, result: 'DENIED_EXPIRED_MEMBERSHIP', reason: 'No active membership' }
        }

        // Check room permissions for membership plan
        const hasRoomAccess = activeMembership.plan.roomPermissions.length > 0
        if (!hasRoomAccess) {
          return { granted: false, result: 'DENIED_NO_PERMISSION', reason: 'Membership plan does not include access to this room' }
        }

        // Check time restrictions
        const permission = activeMembership.plan.roomPermissions[0]
        if (permission.timeRestrictions) {
          const timeValid = this.validateTimeRestrictions(permission.timeRestrictions as any)
          if (!timeValid) {
            return { granted: false, result: 'DENIED_TIME_RESTRICTION', reason: 'Access not allowed at this time' }
          }
        }
      }

      // Staff access validation
      if (userId) {
        const user = await prisma.user.findFirst({
          where: { id: userId, branchId, isActive: true },
          include: {
            roomPermissions: {
              where: { roomId, isActive: true },
            },
          },
        })

        if (!user) {
          return { granted: false, result: 'DENIED_INVALID_CREDENTIAL', reason: 'Staff member not found' }
        }

        // Super admin and admin have full access
        const userRoles = await prisma.userRoleAssignment.findMany({
          where: { userId },
          include: { role: true },
        })

        const hasAdminRole = userRoles.some(ur => 
          ur.role.name === 'super_admin' || ur.role.name === 'admin'
        )

        if (hasAdminRole) {
          return { granted: true, result: 'GRANTED' }
        }

        // Check specific room permissions for staff
        const hasRoomAccess = user.roomPermissions.length > 0
        if (!hasRoomAccess) {
          return { granted: false, result: 'DENIED_NO_PERMISSION', reason: 'Staff member does not have access to this room' }
        }
      }

      // Check temporary access
      const tempAccess = await prisma.temporaryAccess.findFirst({
        where: {
          branchId,
          roomId,
          ...(memberId && { memberId }),
          ...(userId && { userId }),
          isActive: true,
          startTime: { lte: new Date() },
          endTime: { gte: new Date() },
        },
      })

      if (tempAccess) {
        return { granted: true, result: 'GRANTED' }
      }

      return { granted: true, result: 'GRANTED' }
    } catch (error) {
      console.error('Access validation error:', error)
      return { granted: false, result: 'DENIED_DEVICE_ERROR', reason: 'System error during validation' }
    }
  }

  // Log access attempt
  static async logAccess(attempt: AccessAttempt, result: AccessResult, failureReason?: string) {
    const user = attempt.userId ? await prisma.user.findUnique({ where: { id: attempt.userId } }) : null
    const member = attempt.memberId ? await prisma.member.findUnique({ where: { id: attempt.memberId } }) : null

    return await prisma.accessLog.create({
      data: {
        tenantId: user?.tenantId || member?.tenantId || '',
        branchId: attempt.branchId,
        roomId: attempt.roomId,
        deviceId: attempt.deviceId,
        memberId: attempt.memberId,
        userId: attempt.userId,
        accessMethod: attempt.accessMethod,
        accessResult: result,
        failureReason,
        cardId: attempt.cardId,
        biometricId: attempt.biometricId,
        ipAddress: attempt.ipAddress,
        userAgent: attempt.userAgent,
      },
    })
  }

  // Process access attempt (validate + log)
  static async processAccess(attempt: AccessAttempt) {
    const validation = await this.validateAccess(attempt)
    
    // Log the access attempt
    const accessLog = await this.logAccess(attempt, validation.result, validation.reason)

    // Create alert for failed attempts
    if (!validation.granted) {
      await this.createAccessAlert(attempt, validation.result, validation.reason)
    }

    // Check for multiple failed attempts
    if (!validation.granted) {
      await this.checkMultipleFailedAttempts(attempt)
    }

    return {
      ...validation,
      logId: accessLog.id,
    }
  }

  // Create temporary access
  static async createTemporaryAccess(data: TemporaryAccessData) {
    const user = await prisma.user.findUnique({ where: { id: data.createdBy } })
    if (!user) {
      throw new Error('Creator user not found')
    }

    return await prisma.temporaryAccess.create({
      data: {
        ...data,
        tenantId: user.tenantId,
      },
    })
  }

  // Get access logs with filters
  static async getAccessLogs(filters: {
    branchId?: string
    roomId?: string
    memberId?: string
    userId?: string
    startDate?: Date
    endDate?: Date
    accessResult?: AccessResult
  }, page = 1, limit = 50) {
    const where: any = {}

    if (filters.branchId) where.branchId = filters.branchId
    if (filters.roomId) where.roomId = filters.roomId
    if (filters.memberId) where.memberId = filters.memberId
    if (filters.userId) where.userId = filters.userId
    if (filters.accessResult) where.accessResult = filters.accessResult

    if (filters.startDate && filters.endDate) {
      where.accessTime = {
        gte: filters.startDate,
        lte: filters.endDate,
      }
    }

    const [logs, total] = await Promise.all([
      prisma.accessLog.findMany({
        where,
        include: {
          room: true,
          member: {
            select: {
              firstName: true,
              lastName: true,
              membershipId: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
          device: true,
        },
        orderBy: { accessTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.accessLog.count({ where }),
    ])

    return {
      logs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  // Get current occupancy
  static async getCurrentOccupancy(branchId: string, roomId?: string) {
    const where: any = {
      branchId,
      accessResult: 'GRANTED',
      exitTime: null,
    }

    if (roomId) where.roomId = roomId

    const occupancy = await prisma.accessLog.findMany({
      where,
      include: {
        room: true,
        member: {
          select: {
            firstName: true,
            lastName: true,
            membershipId: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { accessTime: 'desc' },
    })

    return occupancy
  }

  // Create access alert
  private static async createAccessAlert(attempt: AccessAttempt, result: AccessResult, reason?: string) {
    const user = attempt.userId ? await prisma.user.findUnique({ where: { id: attempt.userId } }) : null
    const member = attempt.memberId ? await prisma.member.findUnique({ where: { id: attempt.memberId } }) : null

    const alertTypes: Record<AccessResult, AlertType | null> = {
      GRANTED: null,
      DENIED_EXPIRED_MEMBERSHIP: 'EXPIRED_MEMBERSHIP_ACCESS',
      DENIED_NO_PERMISSION: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      DENIED_TIME_RESTRICTION: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      DENIED_DEVICE_ERROR: 'DEVICE_OFFLINE',
      DENIED_INVALID_CREDENTIAL: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      DENIED_SUSPENDED_MEMBER: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      DENIED_CAPACITY_FULL: 'CAPACITY_EXCEEDED',
    }

    const alertType = alertTypes[result]
    if (!alertType) return

    const severity: AlertSeverity = result === 'DENIED_DEVICE_ERROR' ? 'HIGH' : 'MEDIUM'

    return await prisma.accessAlert.create({
      data: {
        tenantId: user?.tenantId || member?.tenantId || '',
        branchId: attempt.branchId,
        alertType,
        severity,
        title: `Access Denied: ${result.replace('DENIED_', '').replace('_', ' ')}`,
        message: reason || `Access attempt failed: ${result}`,
        metadata: {
          roomId: attempt.roomId,
          deviceId: attempt.deviceId,
          memberId: attempt.memberId,
          userId: attempt.userId,
          accessMethod: attempt.accessMethod,
        },
      },
    })
  }

  // Check for multiple failed attempts
  private static async checkMultipleFailedAttempts(attempt: AccessAttempt) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    const failedAttempts = await prisma.accessLog.count({
      where: {
        branchId: attempt.branchId,
        roomId: attempt.roomId,
        ...(attempt.memberId && { memberId: attempt.memberId }),
        ...(attempt.userId && { userId: attempt.userId }),
        accessResult: { not: 'GRANTED' },
        accessTime: { gte: fiveMinutesAgo },
      },
    })

    if (failedAttempts >= 3) {
      const user = attempt.userId ? await prisma.user.findUnique({ where: { id: attempt.userId } }) : null
      const member = attempt.memberId ? await prisma.member.findUnique({ where: { id: attempt.memberId } }) : null

      await prisma.accessAlert.create({
        data: {
          tenantId: user?.tenantId || member?.tenantId || '',
          branchId: attempt.branchId,
          alertType: 'MULTIPLE_FAILED_ATTEMPTS',
          severity: 'HIGH',
          title: 'Multiple Failed Access Attempts',
          message: `${failedAttempts} failed access attempts in the last 5 minutes`,
          metadata: {
            roomId: attempt.roomId,
            deviceId: attempt.deviceId,
            memberId: attempt.memberId,
            userId: attempt.userId,
            failedAttempts,
          },
        },
      })
    }
  }

  // Validate time restrictions
  private static validateTimeRestrictions(restrictions: {
    days?: string[]
    startTime?: string
    endTime?: string
  }): boolean {
    const now = new Date()
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format

    // Check day restrictions
    if (restrictions.days && restrictions.days.length > 0) {
      if (!restrictions.days.includes(currentDay)) {
        return false
      }
    }

    // Check time restrictions
    if (restrictions.startTime && restrictions.endTime) {
      if (currentTime < restrictions.startTime || currentTime > restrictions.endTime) {
        return false
      }
    }

    return true
  }

  // Get access alerts
  static async getAccessAlerts(branchId: string, unreadOnly = false) {
    return await prisma.accessAlert.findMany({
      where: {
        branchId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  // Mark alert as read
  static async markAlertAsRead(alertId: string) {
    return await prisma.accessAlert.update({
      where: { id: alertId },
      data: { isRead: true },
    })
  }

  // Resolve alert
  static async resolveAlert(alertId: string, resolvedBy: string) {
    return await prisma.accessAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedBy,
        resolvedAt: new Date(),
      },
    })
  }
}