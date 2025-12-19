import { prisma } from '@/libs/prisma'
import { Branch } from '@prisma/client'

export interface CreateBranchData {
  tenantId: string
  name: string
  code: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  phone?: string
  email?: string
  currency?: string
  timezone?: string
  logo?: string
}

export interface UpdateBranchData extends Partial<CreateBranchData> {
  id: string
  isActive?: boolean
}

export interface BranchFilters {
  tenantId: string
  isActive?: boolean
  search?: string
  city?: string
  state?: string
  country?: string
}

export class BranchService {
  /**
   * Create a new branch
   */
  static async createBranch(data: CreateBranchData): Promise<Branch> {
    return await prisma.branch.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        code: data.code,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: data.country,
        phone: data.phone,
        email: data.email,
        currency: data.currency || 'INR',
        timezone: data.timezone || 'Asia/Kolkata',
        logo: data.logo,
        isActive: true,
      },
    })
  }

  /**
   * Update an existing branch
   */
  static async updateBranch(data: UpdateBranchData): Promise<Branch> {
    const { id, ...updateData } = data
    return await prisma.branch.update({
      where: { id },
      data: updateData,
    })
  }

  /**
   * Soft delete a branch by setting isActive to false
   */
  static async deleteBranch(id: string): Promise<Branch> {
    return await prisma.branch.update({
      where: { id },
      data: { isActive: false },
    })
  }

  /**
   * Hard delete a branch (use with caution)
   */
  static async hardDeleteBranch(id: string): Promise<void> {
    await prisma.branch.delete({
      where: { id },
    })
  }

  /**
   * Get a single branch by ID
   */
  static async getBranch(id: string) {
    return await prisma.branch.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            lastLoginAt: true,
          },
          where: { isActive: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            users: true,
            members: true,
            membershipPlans: true,
            products: true,
          },
        },
      },
    })
  }

  /**
   * Get all branches with filters and pagination
   */
  static async getBranches(filters: BranchFilters = {} as BranchFilters, page = 1, limit = 20) {
    const where: any = {
      tenantId: filters.tenantId,
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { state: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' }
    }

    if (filters.state) {
      where.state = { contains: filters.state, mode: 'insensitive' }
    }

    if (filters.country) {
      where.country = { contains: filters.country, mode: 'insensitive' }
    }

    const [branches, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              members: true,
              membershipPlans: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.branch.count({ where }),
    ])

    return {
      branches,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  /**
   * Get branch statistics
   */
  static async getBranchStats(tenantId: string, branchId?: string) {
    const where = branchId ? { branchId } : { tenantId }

    const [
      totalBranches,
      activeBranches,
      totalMembers,
      activeMembers,
      totalRevenue,
    ] = await Promise.all([
      branchId ? 1 : prisma.branch.count({ where: { tenantId } }),
      branchId ? 1 : prisma.branch.count({ where: { tenantId, isActive: true } }),
      prisma.member.count({ where }),
      prisma.member.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.transaction.aggregate({
        where: {
          ...where,
          status: 'COMPLETED',
          transactionType: { in: ['MEMBERSHIP', 'PRODUCT_SALE'] },
        },
        _sum: { amount: true },
      }),
    ])

    return {
      totalBranches,
      activeBranches,
      totalMembers,
      activeMembers,
      totalRevenue: Number(totalRevenue._sum.amount || 0),
    }
  }

  /**
   * Assign a user to a branch
   */
  static async assignUserToBranch(userId: string, branchId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { branchId },
    })
  }

  /**
   * Get all users assigned to a branch
   */
  static async getBranchUsers(branchId: string) {
    return await prisma.user.findMany({
      where: { branchId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get branch revenue statistics
   */
  static async getBranchRevenue(branchId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      branchId,
      status: 'COMPLETED',
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    const [membershipRevenue, productRevenue, totalTransactions] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, transactionType: 'MEMBERSHIP' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { ...where, transactionType: 'PRODUCT_SALE' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.count({ where }),
    ])

    return {
      membershipRevenue: Number(membershipRevenue._sum.amount || 0),
      productRevenue: Number(productRevenue._sum.amount || 0),
      totalRevenue: Number(membershipRevenue._sum.amount || 0) + Number(productRevenue._sum.amount || 0),
      totalTransactions,
      membershipTransactions: membershipRevenue._count,
      productTransactions: productRevenue._count,
    }
  }

  /**
   * Get branch by code
   */
  static async getBranchByCode(tenantId: string, code: string): Promise<Branch | null> {
    return await prisma.branch.findFirst({
      where: { tenantId, code },
    })
  }

  /**
   * Check if branch code is unique within tenant
   */
  static async isCodeUnique(tenantId: string, code: string, excludeId?: string): Promise<boolean> {
    const existing = await prisma.branch.findFirst({
      where: {
        tenantId,
        code,
        ...(excludeId && { id: { not: excludeId } }),
      },
    })
    return !existing
  }
}
