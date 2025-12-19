import { Prisma } from '@prisma/client'
import type { AuthContext } from './serverAuth'

export class BranchScopeBuilder {
  static applyBranchScope<T extends { tenantId?: any; branchId?: any }>(
    context: AuthContext,
    where: T = {} as T
  ): T {
    return {
      ...where,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    } as T
  }

  static memberWhere(context: AuthContext, additional?: Prisma.MemberWhereInput): Prisma.MemberWhereInput {
    return {
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
      deletedAt: null,
      ...additional,
    }
  }

  static staffWhere(context: AuthContext, additional?: Prisma.StaffMemberWhereInput): Prisma.StaffMemberWhereInput {
    return {
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
      status: { not: 'TERMINATED' },
      ...additional,
    }
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class PaginationHelper {
  static getSkipTake(params?: PaginationParams) {
    const page = params?.page || 1
    const limit = params?.limit || 20
    const skip = (page - 1) * limit

    return { page, limit, skip, take: limit }
  }

  static buildResult<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}
