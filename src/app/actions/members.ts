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
    avatar: member.avatarUrl || undefined,
    membershipId: member.membershipId,
    status: member.status,
    membershipPlan: member.memberships[0]?.plan?.name || 'None',
    startDate: member.memberships[0]?.startDate?.toISOString() || '',
    endDate: member.memberships[0]?.endDate?.toISOString() || '',
    emergencyContact: member.emergencyContact || undefined,
    emergencyPhone: member.emergencyPhone || undefined,
    bloodGroup: member.bloodGroup || undefined,
    medicalNotes: member.medicalConditions || undefined,
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

export async function registerMemberWithPlan(data: {
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
  planId: string
  startDate?: Date
  amountPaid?: number
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

  const plan = await prisma.membershipPlan.findFirst({
    where: {
      id: data.planId,
      tenantId: context.tenantId,
    },
    include: {
      benefits: {
        where: { isActive: true },
      },
    },
  })

  if (!plan) {
    throw new Error('Membership plan not found')
  }

  const membershipIdCode = `MEM${Date.now().toString().slice(-8)}`
  const startDate = data.startDate || new Date()
  
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + plan.durationMonths)

  const totalPrice = Number(plan.basePrice) || Number(plan.price)
  const amountPaid = data.amountPaid || 0
  const balanceDue = totalPrice - amountPaid

  const result = await prisma.$transaction(async (tx) => {
    const member = await tx.member.create({
      data: {
        tenantId: context.tenantId,
        branchId,
        membershipId: membershipIdCode,
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

    const membership = await tx.memberMembership.create({
      data: {
        memberId: member.id,
        planId: plan.id,
        branchId,
        startDate,
        endDate,
        status: 'ACTIVE',
        totalPrice: String(totalPrice),
        amountPaid: String(amountPaid),
        balanceDue: String(balanceDue),
      },
    })

    const benefitLedgerPromises = plan.benefits.map((benefit) => {
      const quantityPerMonth = benefit.quantityPerMonth || 0
      const totalAllocated = quantityPerMonth * plan.durationMonths
      return tx.benefitLedger.create({
        data: {
          memberMembershipId: membership.id,
          benefitId: benefit.id,
          totalAllocated,
          usedCount: 0,
          remainingCount: totalAllocated,
        },
      })
    })

    const benefitLedgers = await Promise.all(benefitLedgerPromises)

    return {
      member,
      membership,
      benefitLedgers,
    }
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId,
    action: 'Member.registeredWithPlan',
    resource: 'Member',
    resourceId: result.member.id,
    newValues: {
      membershipId: result.member.membershipId,
      firstName: result.member.firstName,
      lastName: result.member.lastName,
      email: result.member.email,
      planId: plan.id,
      planName: plan.name,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalPrice,
      amountPaid,
      balanceDue,
      benefitLedgersCreated: result.benefitLedgers.length,
    }
  })

  return result
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

export async function getMemberProfile(id: string) {
  const context = await requirePermission('members.view')

  const member = await prisma.member.findFirst({
    where: {
      id,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    include: {
      branch: { select: { id: true, name: true, address: true, phone: true } },
      memberships: {
        include: { 
          plan: { 
            include: { 
              benefits: true 
            } 
          } 
        },
        orderBy: { startDate: 'desc' },
      },
      attendanceRecords: {
        orderBy: { checkInTime: 'desc' },
        take: 20,
      },
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { branch: { select: { name: true } } },
      },
      goals: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      benefitBalances: {
        where: { currentBalance: { gt: 0 } },
        include: { benefit: true },
      },
      trainerAssignments: {
        where: { status: 'ACTIVE' },
        include: { 
          trainer: { 
            include: { 
              user: { select: { id: true } } 
            } 
          } 
        },
        take: 1,
      },
      classBookings: {
        orderBy: { bookedAt: 'desc' },
        take: 10,
        include: { 
          schedule: { 
            include: { 
              class: { select: { name: true, classType: true } } 
            } 
          } 
        },
      },
      lifecycleEvents: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!member) {
    throw new Error('Member not found')
  }

  const attendanceCount = await prisma.attendanceRecord.count({
    where: { memberId: id },
  })

  const activityTimeline = buildActivityTimeline(member)

  return {
    ...member,
    totalAttendance: attendanceCount,
    activityTimeline,
  }
}

function buildActivityTimeline(member: any): Array<{
  id: string
  type: 'attendance' | 'payment' | 'membership' | 'class' | 'goal' | 'lifecycle'
  title: string
  description: string
  date: Date
  icon: string
  color: string
}> {
  const timeline: Array<{
    id: string
    type: 'attendance' | 'payment' | 'membership' | 'class' | 'goal' | 'lifecycle'
    title: string
    description: string
    date: Date
    icon: string
    color: string
  }> = []

  member.attendanceRecords?.forEach((record: any) => {
    timeline.push({
      id: `att-${record.id}`,
      type: 'attendance',
      title: 'Gym Visit',
      description: record.checkOutTime 
        ? `Checked in and worked out for ${Math.round((new Date(record.checkOutTime).getTime() - new Date(record.checkInTime).getTime()) / 60000)} minutes`
        : 'Checked in at gym',
      date: record.checkInTime,
      icon: 'tabler-run',
      color: 'success',
    })
  })

  member.transactions?.forEach((tx: any) => {
    timeline.push({
      id: `tx-${tx.id}`,
      type: 'payment',
      title: tx.transactionType === 'MEMBERSHIP' ? 'Membership Payment' : 'Payment',
      description: `₹${tx.amount.toFixed(2)} via ${tx.paymentMethod || 'N/A'}`,
      date: tx.createdAt,
      icon: 'tabler-credit-card',
      color: tx.status === 'COMPLETED' ? 'primary' : 'warning',
    })
  })

  member.memberships?.forEach((ms: any) => {
    timeline.push({
      id: `ms-${ms.id}`,
      type: 'membership',
      title: ms.status === 'ACTIVE' ? 'Membership Activated' : `Membership ${ms.status}`,
      description: `${ms.plan?.name || 'Unknown Plan'} - ${new Date(ms.startDate).toLocaleDateString()} to ${new Date(ms.endDate).toLocaleDateString()}`,
      date: ms.startDate,
      icon: 'tabler-id-badge',
      color: ms.status === 'ACTIVE' ? 'success' : 'secondary',
    })
  })

  member.classBookings?.forEach((booking: any) => {
    timeline.push({
      id: `class-${booking.id}`,
      type: 'class',
      title: 'Class Booked',
      description: booking.classSchedule?.gymClass?.name || 'Unknown Class',
      date: booking.bookedAt,
      icon: 'tabler-yoga',
      color: 'info',
    })
  })

  member.lifecycleEvents?.forEach((event: any) => {
    timeline.push({
      id: `lc-${event.id}`,
      type: 'lifecycle',
      title: formatLifecycleEvent(event.eventType),
      description: event.notes || '',
      date: event.createdAt,
      icon: getLifecycleIcon(event.eventType),
      color: getLifecycleColor(event.eventType),
    })
  })

  return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30)
}

function formatLifecycleEvent(eventType: string): string {
  const map: Record<string, string> = {
    CREATED: 'Account Created',
    ACTIVATED: 'Membership Activated',
    RENEWED: 'Membership Renewed',
    FROZEN: 'Membership Frozen',
    UNFROZEN: 'Membership Unfrozen',
    CANCELLED: 'Membership Cancelled',
    UPGRADED: 'Plan Upgraded',
    DOWNGRADED: 'Plan Downgraded',
    EXPIRED: 'Membership Expired',
    TRANSFERRED: 'Membership Transferred',
  }
  return map[eventType] || eventType
}

function getLifecycleIcon(eventType: string): string {
  const map: Record<string, string> = {
    CREATED: 'tabler-user-plus',
    ACTIVATED: 'tabler-check',
    RENEWED: 'tabler-refresh',
    FROZEN: 'tabler-snowflake',
    UNFROZEN: 'tabler-sun',
    CANCELLED: 'tabler-x',
    UPGRADED: 'tabler-arrow-up',
    DOWNGRADED: 'tabler-arrow-down',
    EXPIRED: 'tabler-clock-off',
    TRANSFERRED: 'tabler-transfer',
  }
  return map[eventType] || 'tabler-info-circle'
}

function getLifecycleColor(eventType: string): string {
  const map: Record<string, string> = {
    CREATED: 'primary',
    ACTIVATED: 'success',
    RENEWED: 'success',
    FROZEN: 'info',
    UNFROZEN: 'success',
    CANCELLED: 'error',
    UPGRADED: 'primary',
    DOWNGRADED: 'warning',
    EXPIRED: 'error',
    TRANSFERRED: 'secondary',
  }
  return map[eventType] || 'secondary'
}

export async function freezeMembership(membershipId: string, reason?: string) {
  const context = await requirePermission('members.update')

  const membership = await prisma.memberMembership.findFirst({
    where: { id: membershipId },
    include: { member: true },
  })

  if (!membership) {
    throw new Error('Membership not found')
  }

  if (membership.member.tenantId !== context.tenantId) {
    throw new Error('Unauthorized')
  }

  if (context.branchId && membership.member.branchId !== context.branchId) {
    throw new Error('Unauthorized')
  }

  if (membership.status !== 'ACTIVE') {
    throw new Error('Only active memberships can be frozen')
  }

  const updated = await prisma.memberMembership.update({
    where: { id: membershipId },
    data: {
      status: 'FROZEN',
      notes: `Frozen on ${new Date().toISOString()}${reason ? `: ${reason}` : ''}`,
    },
  })

  await prisma.membershipLifecycleEvent.create({
    data: {
      tenantId: context.tenantId,
      branchId: membership.member.branchId,
      membershipId,
      memberId: membership.memberId,
      eventType: 'FROZEN',
      effectiveDate: new Date(),
      reason: reason,
      performedBy: context.userId,
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: membership.member.branchId,
    action: 'Membership.frozen',
    resource: 'MemberMembership',
    resourceId: membershipId,
    newValues: { status: 'FROZEN', reason },
  })

  return updated
}

export async function unfreezeMembership(membershipId: string) {
  const context = await requirePermission('members.update')

  const membership = await prisma.memberMembership.findFirst({
    where: { id: membershipId },
    include: { member: true },
  })

  if (!membership) {
    throw new Error('Membership not found')
  }

  if (membership.member.tenantId !== context.tenantId) {
    throw new Error('Unauthorized')
  }

  if (context.branchId && membership.member.branchId !== context.branchId) {
    throw new Error('Unauthorized')
  }

  if (membership.status !== 'FROZEN') {
    throw new Error('Only frozen memberships can be unfrozen')
  }

  const lastFreezeEvent = await prisma.membershipLifecycleEvent.findFirst({
    where: { membershipId, eventType: 'FROZEN' },
    orderBy: { createdAt: 'desc' },
  })

  const frozenDays = lastFreezeEvent
    ? Math.ceil((Date.now() - lastFreezeEvent.effectiveDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const newEndDate = new Date(membership.endDate)
  newEndDate.setDate(newEndDate.getDate() + frozenDays)

  const totalFreezeDays = membership.freezeDays + frozenDays

  const updated = await prisma.memberMembership.update({
    where: { id: membershipId },
    data: {
      status: 'ACTIVE',
      freezeDays: totalFreezeDays,
      endDate: newEndDate,
      notes: null,
    },
  })

  await prisma.membershipLifecycleEvent.create({
    data: {
      tenantId: context.tenantId,
      branchId: membership.member.branchId,
      membershipId,
      memberId: membership.memberId,
      eventType: 'UNFROZEN',
      effectiveDate: new Date(),
      durationDays: frozenDays,
      notes: `Extended by ${frozenDays} days`,
      performedBy: context.userId,
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: membership.member.branchId,
    action: 'Membership.unfrozen',
    resource: 'MemberMembership',
    resourceId: membershipId,
    newValues: { status: 'ACTIVE', extendedDays: frozenDays, newEndDate },
  })

  return updated
}
