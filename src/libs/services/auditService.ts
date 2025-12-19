import { prisma } from '@/lib/prisma'
import { AuditLog } from '@prisma/client'

export interface CreateAuditLogData {
  tenantId: string
  branchId?: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  oldData?: any
  newData?: any
  metadata?: any
  ipAddress?: string
  userAgent?: string
}

export interface AuditFilters {
  tenantId: string
  branchId?: string
  userId?: string
  action?: string
  resource?: string
  startDate?: Date
  endDate?: Date
}

export class AuditService {
  static async createAuditLog(data: CreateAuditLogData): Promise<AuditLog> {
    return await prisma.auditLog.create({
      data,
    })
  }

  static async getAuditLogs(filters: AuditFilters, page = 1, limit = 50) {
    const where: any = { tenantId: filters.tenantId }

    if (filters.branchId) where.branchId = filters.branchId
    if (filters.userId) where.userId = filters.userId
    if (filters.action) where.action = filters.action
    if (filters.resource) where.resource = filters.resource

    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: filters.startDate,
        lte: filters.endDate,
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          branch: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return {
      logs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  static async getCriticalActions(tenantId: string, branchId?: string, hours = 24) {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000)

    const criticalActions = [
      'CREATE_USER',
      'DELETE_USER',
      'CHANGE_ROLE',
      'PAYMENT_PROCESSED',
      'MEMBERSHIP_CREATED',
      'MEMBERSHIP_CANCELLED',
      'FREEZE_MEMBERSHIP',
      'UNFREEZE_MEMBERSHIP',
      'REFUND_PROCESSED',
    ]

    return await prisma.auditLog.findMany({
      where: {
        tenantId,
        ...(branchId && { branchId }),
        action: { in: criticalActions },
        createdAt: { gte: startTime },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  }

  static async getAuditStats(tenantId: string, branchId?: string) {
    const where: any = { tenantId }
    if (branchId) where.branchId = branchId

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalLogs,
      logsLast24Hours,
      logsLast7Days,
      topActions,
      topUsers,
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({ where: { ...where, createdAt: { gte: last24Hours } } }),
      prisma.auditLog.count({ where: { ...where, createdAt: { gte: last7Days } } }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { ...where, createdAt: { gte: last7Days } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { ...where, createdAt: { gte: last7Days } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ])

    return {
      totalLogs,
      logsLast24Hours,
      logsLast7Days,
      topActions,
      topUsers,
    }
  }

  // Middleware helper for automatic audit logging
  static async logUserAction(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    oldData?: any,
    newData?: any,
    request?: any
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true, branchId: true },
    })

    if (!user) return

    await this.createAuditLog({
      tenantId: user.tenantId,
      branchId: user.branchId,
      userId,
      action,
      resource,
      resourceId,
      oldData,
      newData,
      ipAddress: request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip'),
      userAgent: request?.headers?.get('user-agent'),
    })
  }
}