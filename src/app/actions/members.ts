'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'
import { Prisma } from '@prisma/client'

export async function getMembers(filters?: {
  search?: string
  status?: string
  branchId?: string
  membershipStatus?: string
  page?: number
  limit?: number
}) {
  const context = await requirePermission('members.view')

  const page = filters?.page || 1
  const limit = filters?.limit || 20
  const skip = (page - 1) * limit

  const branchFilter = context.branchId || filters?.branchId

  const where: Prisma.MemberWhereInput = {
    tenantId: context.tenantId,
    // Use soft delete: null means active, non-null means deleted
    deletedAt: filters?.status === 'inactive' ? { not: null } : null,
    ...(branchFilter && { branchId: branchFilter }),
    ...(filters?.search && {
      OR: [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { membershipId: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
  }

  const [rawMembers, total] = await Promise.all([
    prisma.member.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: { select: { id: true, name: true } },
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1,
          orderBy: { startDate: 'desc' },
        },
        attendanceRecords: {
          take: 1,
          orderBy: { checkInTime: 'desc' },
        },
      },
    }),
    prisma.member.count({ where }),
  ])

  // Transform Prisma data to match Member type
  const members = rawMembers.map((member) => ({
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email || '',
    phone: member.phone,
    avatar: member.avatarUrl,
    membershipId: member.membershipId,
    status: member.status,
    membershipPlan: member.memberships[0]?.plan?.name || 'None',
    startDate: member.memberships[0]?.startDate?.toISOString() || '',
    endDate: member.memberships[0]?.endDate?.toISOString() || '',
    emergencyContact: member.emergencyContact,
    emergencyPhone: member.emergencyPhone,
    bloodGroup: member.bloodGroup,
    medicalNotes: member.medicalConditions,
    branchId: member.branchId || '',
    branchName: member.branch?.name,
    tenantId: member.tenantId,
    createdAt: member.joinDate.toISOString(),
    lastAttendance: member.attendanceRecords[0]?.checkInTime?.toISOString(),
    totalAttendance: 0, // We can enhance this later with a count query
  }))

  return {
    members,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getMember(id: string) {
  const context = await requirePermission('members.view')

  const member = await prisma.member.findFirst({
    where: {
      id,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    include: {
      branch: true,
      memberships: {
        include: { plan: true },
        orderBy: { startDate: 'desc' },
      },
      attendanceRecords: {
        orderBy: { checkInTime: 'desc' },
        take: 10,
      },
    },
  })

  if (!member) {
    throw new Error('Member not found')
  }

  return member
}

export async function createMember(data: {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: Date
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  avatarUrl?: string
  branchId?: string
}) {
  const context = await requirePermission('members.create')

  let branchId: string

  if (context.branchId) {
    branchId = context.branchId
    if (data.branchId && data.branchId !== context.branchId) {
      throw new Error('Branch-scoped users cannot create members in other branches')
    }
  } else {
    branchId = data.branchId || ''
    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, tenantId: context.tenantId },
      })
      if (!branch) {
        throw new Error('Branch not found or does not belong to your tenant')
      }
    }
  }

  const membershipId = `MEM${Date.now().toString().slice(-8)}`

  const member = await prisma.member.create({
    data: {
      tenantId: context.tenantId,
      branchId,
      membershipId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      address: data.address,
      emergencyContact: data.emergencyContact,
      emergencyPhone: data.emergencyPhone,
      avatarUrl: data.avatarUrl,
      status: 'ACTIVE',
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId,
    action: 'Member.created',
    resource: 'Member',
    resourceId: member.id,
    newValues: {
      membershipId: member.membershipId,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email
    }
  })

  return member
}

export async function updateMember(
  id: string,
  data: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    dateOfBirth?: Date
    gender?: 'MALE' | 'FEMALE' | 'OTHER'
    address?: string
    emergencyContact?: string
    emergencyPhone?: string
    avatarUrl?: string
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  }
) {
  const context = await requirePermission('members.update')

  const oldMember = await prisma.member.findFirst({
    where: {
      id,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
  })

  if (!oldMember) {
    throw new Error('Member not found')
  }

  const member = await prisma.member.update({
    where: {
      id,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    data,
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: member.branchId,
    action: 'Member.updated',
    resource: 'Member',
    resourceId: member.id,
    oldValues: oldMember as any,
    newValues: data as any
  })

  return member
}

export async function deleteMember(id: string) {
  const context = await requirePermission('members.delete')

  const member = await prisma.member.findFirst({
    where: {
      id,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
  })

  if (!member) {
    throw new Error('Member not found')
  }

  await prisma.member.update({
    where: {
      id,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    data: { 
      deletedAt: new Date(),
      deletedBy: context.userId,
      status: 'INACTIVE',
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: member.branchId,
    action: 'Member.deleted',
    resource: 'Member',
    resourceId: id,
    oldValues: {
      membershipId: member.membershipId,
      firstName: member.firstName,
      lastName: member.lastName
    }
  })

  return { success: true }
}
