'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'
import { revalidatePath } from 'next/cache'

export async function checkInMember(memberId: string, data?: { notes?: string }) {
  const context = await requirePermission('members.checkin')

  try {
    // Get member details
    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        tenantId: context.tenantId,
        branchId: context.branchId,
      },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            planId: true,
            startDate: true,
            endDate: true,
          },
          take: 1,
        },
      },
    })

    if (!member) {
      throw new Error('Member not found or access denied')
    }

    // Check if member has active membership
    if (member.memberships.length === 0) {
      throw new Error('Member has no active membership')
    }

    const activeMembership = member.memberships[0]

    // Create attendance record
    const attendanceRecord = await prisma.attendanceRecord.create({
      data: {
        memberId,
        checkInTime: new Date(),
        notes: data?.notes || undefined,
        tenantId: context.tenantId,
        branchId: context.branchId,
      },
    })

    // Log audit
    await AuditLogger.log({
      userId: context.userId,
      tenantId: context.tenantId,
      branchId: context.branchId,
      action: 'Member.checkedin',
      resource: 'AttendanceRecord',
      resourceId: attendanceRecord.id,
      newValues: {
        memberName: `${member.firstName} ${member.lastName}`,
        membershipId: activeMembership.id,
        checkInTime: attendanceRecord.checkInTime,
      },
    })

    revalidatePath('/apps/checkin')

    return {
      success: true,
      attendanceRecord: {
        id: attendanceRecord.id,
        memberName: `${member.firstName} ${member.lastName}`,
        checkInTime: attendanceRecord.checkInTime,
        membershipId: activeMembership.id,
      },
    }
  } catch (error) {
    console.error('Error checking in member:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check in member',
    }
  }
}

export async function searchMembers(query: string) {
  const context = await requirePermission('members.view')

  if (!query || query.length < 2) {
    return []
  }

  const members = await prisma.member.findMany({
    where: {
      tenantId: context.tenantId,
      branchId: context.branchId,
      status: 'ACTIVE',
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { membershipId: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      memberships: {
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          status: true,
          planId: true,
        },
        take: 1,
      },
    },
    take: 10,
  })

  // Type assertion for include
  type MemberWithMemberships = typeof members[0]

  return members.map((member) => ({
    id: member.id,
    name: `${member.firstName} ${member.lastName}`,
    email: member.email,
    phone: member.phone,
    membershipId: member.membershipId,
    hasActiveMembership: member.memberships.length > 0,
    avatar: member.avatarUrl,
  }))
}

export async function getTodayCheckins() {
  const context = await requirePermission('members.view')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const checkins = await prisma.attendanceRecord.findMany({
    where: {
      tenantId: context.tenantId,
      branchId: context.branchId,
      checkInTime: {
        gte: today,
        lt: tomorrow,
      },
      memberId: {
        not: undefined,
      },
    },
    orderBy: {
      checkInTime: 'desc',
    },
  })

  // Fetch member details separately for each attendance record
  const checkinDetails = await Promise.all(
    checkins.map(async (record) => {
      if (!record.memberId) return null

      const member = await prisma.member.findUnique({
        where: { id: record.memberId },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      })

      return {
        id: record.id,
        memberName: member ? `${member.firstName} ${member.lastName}` : 'Unknown',
        email: member?.email || '',
        phone: member?.phone || '',
        checkInTime: record.checkInTime,
        planName: 'Active Membership',
        notes: record.notes,
        avatar: member?.avatarUrl || undefined,
      }
    })
  )

  return checkinDetails.filter((detail) => detail !== null) as any[]
}

export async function getCheckInStats() {
  const context = await requirePermission('members.view')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const totalCheckinsToday = await prisma.attendanceRecord.count({
    where: {
      tenantId: context.tenantId,
      branchId: context.branchId,
      checkInTime: {
        gte: today,
        lt: tomorrow,
      },
      memberId: {
        not: undefined,
      },
    },
  })

  const activeMemberships = await prisma.memberMembership.count({
    where: {
      branchId: context.branchId,
      status: 'ACTIVE',
    },
  })

  const attendanceRate =
    activeMemberships > 0 ? ((totalCheckinsToday / activeMemberships) * 100).toFixed(1) : '0'

  return {
    totalCheckinsToday,
    activeMemberships,
    attendanceRate: parseFloat(attendanceRate),
  }
}
