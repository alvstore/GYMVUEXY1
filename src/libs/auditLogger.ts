import { prisma } from '@/libs/prisma'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'VIEW'
  | 'EXPORT'
  | 'APPROVE'
  | 'REJECT'
  | 'PAYMENT'
  | 'REFUND'

export interface AuditLogData {
  userId?: string | null
  tenantId: string
  branchId?: string | null
  action: string
  resource: string
  resourceId?: string | null
  oldValues?: Record<string, any> | null
  newValues?: Record<string, any> | null
  ipAddress?: string | null
  userAgent?: string | null
}

export class AuditLogger {
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId || undefined,
          tenantId: data.tenantId,
          branchId: data.branchId || undefined,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId || undefined,
          oldValues: data.oldValues || undefined,
          newValues: data.newValues || undefined,
          ipAddress: data.ipAddress || undefined,
          userAgent: data.userAgent || undefined,
        },
      })
    } catch (error) {
      console.error('Audit log failed:', error)
    }
  }

  static async logCreate(
    userId: string,
    tenantId: string,
    resource: string,
    resourceId: string,
    data: Record<string, any>,
    branchId?: string | null
  ): Promise<void> {
    await this.log({
      userId,
      tenantId,
      branchId,
      action: `${resource}.created`,
      resource,
      resourceId,
      newValues: data,
    })
  }

  static async logUpdate(
    userId: string,
    tenantId: string,
    resource: string,
    resourceId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    branchId?: string | null
  ): Promise<void> {
    await this.log({
      userId,
      tenantId,
      branchId,
      action: `${resource}.updated`,
      resource,
      resourceId,
      oldValues: oldData,
      newValues: newData,
    })
  }

  static async logDelete(
    userId: string,
    tenantId: string,
    resource: string,
    resourceId: string,
    branchId?: string | null
  ): Promise<void> {
    await this.log({
      userId,
      tenantId,
      branchId,
      action: `${resource}.deleted`,
      resource,
      resourceId,
    })
  }
}
