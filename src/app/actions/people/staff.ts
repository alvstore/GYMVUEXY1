'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'
import { BranchScopeBuilder, PaginationHelper } from '@/libs/branchScope'
import { Prisma } from '@prisma/client'

export async function getStaff(filters?: {
  search?: string
  role?: string
  department?: string
  status?: string
  page?: number
  limit?: number
}) {
  const context = await requirePermission('staff.view')
  const { page, limit, skip, take } = PaginationHelper.getSkipTake(filters)

  const where: Prisma.StaffMemberWhereInput = BranchScopeBuilder.staffWhere(context, {
    ...(filters?.role && { role: filters.role as any }),
    ...(filters?.department && { department: filters.department }),
    ...(filters?.status && { status: filters.status as any }),
    ...(filters?.search && {
      OR: [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { employeeId: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
  })

  const [staff, total] = await Promise.all([
    prisma.staffMember.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: { select: { id: true, name: true } },
      },
    }),
    prisma.staffMember.count({ where }),
  ])

  return PaginationHelper.buildResult(staff, total, page, limit)
}

export async function createStaff(data: {
  firstName: string
  lastName: string
  email?: string
  phone: string
  dateOfBirth?: Date
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  address?: string
  role: 'MANAGER' | 'TRAINER' | 'RECEPTIONIST' | 'SALES' | 'MAINTENANCE' | 'OTHER'
  department?: string
  designation?: string
  salary?: number
  shiftType?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'FULL_DAY' | 'CUSTOM'
  branchId?: string
}) {
  const context = await requirePermission('staff.create')

  let branchId: string
  if (context.branchId) {
    branchId = context.branchId
  } else {
    branchId = data.branchId || ''
    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, tenantId: context.tenantId },
      })
      if (!branch) throw new Error('Branch not found')
    }
  }

  const employeeId = `EMP${Date.now().toString().slice(-8)}`

  const staff = await prisma.staffMember.create({
    data: {
      tenantId: context.tenantId,
      branchId,
      employeeId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      address: data.address,
      role: data.role,
      department: data.department,
      designation: data.designation,
      salary: data.salary,
      shiftType: data.shiftType as any,
      status: 'ACTIVE',
    },
  })

  await AuditLogger.logCreate(
    context.userId,
    context.tenantId,
    'StaffMember',
    staff.id,
    staff as any,
    branchId
  )

  return staff
}

export async function updateStaff(
  id: string,
  data: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    role?: string
    department?: string
    designation?: string
    salary?: number
    shiftType?: string
    status?: string
  }
) {
  const context = await requirePermission('staff.update')

  const oldStaff = await prisma.staffMember.findFirst({
    where: BranchScopeBuilder.staffWhere(context, { id }),
  })

  if (!oldStaff) throw new Error('Staff member not found')

  const staff = await prisma.staffMember.update({
    where: { id },
    data: data as any,
  })

  await AuditLogger.logUpdate(
    context.userId,
    context.tenantId,
    'StaffMember',
    staff.id,
    oldStaff as any,
    staff as any,
    staff.branchId
  )

  return staff
}

export async function deleteStaff(id: string) {
  const context = await requirePermission('staff.delete')

  const staff = await prisma.staffMember.findFirst({
    where: BranchScopeBuilder.staffWhere(context, { id }),
  })

  if (!staff) throw new Error('Staff member not found')

  await prisma.staffMember.update({
    where: { id },
    data: { status: 'TERMINATED' },
  })

  await AuditLogger.logDelete(context.userId, context.tenantId, 'StaffMember', id, staff.branchId)

  return { success: true }
}
