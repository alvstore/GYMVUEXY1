'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { LockerStatus, MembershipStatus } from '@prisma/client'
import type { Locker } from '@/types/apps/lockerTypes'
import { Decimal } from '@prisma/client/runtime/library'

// Using string literals for enum values to bypass LSP caching issues
// The actual Prisma client has these values
const LockerAssignmentStatusValues = {
  ACTIVE: 'ACTIVE' as const,
  EXPIRED: 'EXPIRED' as const,
  TERMINATED: 'TERMINATED' as const,
  SUSPENDED: 'SUSPENDED' as const,
  PENDING_REVIEW: 'PENDING_REVIEW' as const,
}

const PaymentStatusValues = {
  PENDING: 'PENDING' as const,
  COMPLETED: 'COMPLETED' as const,
}

export interface LockerGridItem {
  id: string
  lockerNumber: string
  floor: number
  section: string
  type: string
  size: string
  status: string
  isPremium: boolean
  monthlyRate: number
  isOccupied: boolean
  assignment?: {
    id: string
    memberId: string
    memberName: string
    startDate: string
    endDate: string
    status: string
    includedInPlan: boolean
    totalFee: number
    paymentStatus: string
  }
}

export interface AssignLockerInput {
  lockerId: string
  memberId: string
  syncWithMembership: boolean
  customEndDate?: string
  includedInPlan: boolean
  securityDeposit?: number
  keyNumber?: string
  notes?: string
}

export async function getLockers(): Promise<Locker[]> {
  const context = await requirePermission('lockers.view')
  
  const lockers = await prisma.locker.findMany({
    where: { 
      branchId: context.branchId!,
    },
    include: {
      assignments: {
        where: { status: LockerAssignmentStatusValues.ACTIVE as any },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        },
        take: 1,
      }
    },
    orderBy: { lockerNumber: 'asc' },
  })

  return lockers.map(locker => {
    const activeAssignment = locker.assignments[0]
    const floorMatch = locker.location?.match(/Floor (\d+)/)
    const sectionMatch = locker.location?.match(/Section (\w+)/)
    
    return {
      id: locker.id,
      number: locker.lockerNumber,
      floor: floorMatch ? parseInt(floorMatch[1]) : 1,
      section: sectionMatch ? sectionMatch[1] : 'A',
      type: locker.lockerType as 'STANDARD' | 'PREMIUM' | 'VIP' | 'TEMPORARY',
      status: locker.status as 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_ORDER',
      size: locker.size as 'SMALL' | 'MEDIUM' | 'LARGE' | undefined,
      occupiedBy: activeAssignment?.memberId || undefined,
      memberName: activeAssignment?.member ? `${activeAssignment.member.firstName} ${activeAssignment.member.lastName}` : undefined,
      assignedDate: activeAssignment?.startDate?.toISOString().split('T')[0],
      dueDate: activeAssignment?.endDate?.toISOString().split('T')[0],
      monthlyFee: Number(locker.monthlyRate) || undefined,
    }
  })
}

export async function getLockerGrid(): Promise<LockerGridItem[]> {
  const context = await requirePermission('lockers.view')
  
  const lockers = await prisma.locker.findMany({
    where: { 
      branchId: context.branchId!,
    },
    include: {
      assignments: {
        where: { 
          status: { in: [LockerAssignmentStatusValues.ACTIVE, LockerAssignmentStatusValues.PENDING_REVIEW] as any }
        },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      }
    },
    orderBy: [
      { location: 'asc' },
      { lockerNumber: 'asc' }
    ],
  })

  return lockers.map(locker => {
    const activeAssignment = locker.assignments[0]
    const floorMatch = locker.location?.match(/Floor (\d+)/)
    const sectionMatch = locker.location?.match(/Section (\w+)/)
    
    return {
      id: locker.id,
      lockerNumber: locker.lockerNumber,
      floor: floorMatch ? parseInt(floorMatch[1]) : 1,
      section: sectionMatch ? sectionMatch[1] : 'A',
      type: locker.lockerType,
      size: locker.size,
      status: locker.status,
      isPremium: (locker as any).isPremium ?? false,
      monthlyRate: Number(locker.monthlyRate),
      isOccupied: locker.isOccupied,
      assignment: activeAssignment ? {
        id: activeAssignment.id,
        memberId: activeAssignment.memberId,
        memberName: `${activeAssignment.member.firstName} ${activeAssignment.member.lastName}`,
        startDate: activeAssignment.startDate.toISOString().split('T')[0],
        endDate: activeAssignment.endDate.toISOString().split('T')[0],
        status: activeAssignment.status,
        includedInPlan: (activeAssignment as any).includedInPlan ?? false,
        totalFee: Number((activeAssignment as any).totalFee ?? 0),
        paymentStatus: activeAssignment.paymentStatus,
      } : undefined,
    }
  })
}

export async function assignLocker(input: AssignLockerInput) {
  const context = await requirePermission('lockers.update')
  
  const { 
    lockerId, 
    memberId, 
    syncWithMembership, 
    customEndDate,
    includedInPlan,
    securityDeposit = 0,
    keyNumber,
    notes 
  } = input

  return await prisma.$transaction(async (tx) => {
    const locker = await tx.locker.findUnique({
      where: { id: lockerId },
    })

    if (!locker) {
      throw { code: 'NOT_FOUND', message: 'Locker not found.' }
    }

    if (locker.status !== LockerStatus.AVAILABLE) {
      throw { code: 'UNAVAILABLE', message: 'This locker is not available for assignment.' }
    }

    const member = await tx.member.findUnique({
      where: { id: memberId },
      include: {
        memberships: {
          where: { status: MembershipStatus.ACTIVE },
          orderBy: { endDate: 'desc' },
          take: 1,
        },
      },
    })

    if (!member) {
      throw { code: 'NOT_FOUND', message: 'Member not found.' }
    }

    const activeMembership = member.memberships[0]
    if (!activeMembership) {
      throw { code: 'MEMBERSHIP_INACTIVE', message: 'Member does not have an active membership.' }
    }

    const existingAssignment = await tx.lockerAssignment.findFirst({
      where: {
        memberId,
        status: LockerAssignmentStatusValues.ACTIVE as any,
      },
      include: { locker: true },
    })

    if (existingAssignment) {
      throw { 
        code: 'ALREADY_ASSIGNED', 
        message: `Member already has locker ${existingAssignment.locker.lockerNumber} assigned.` 
      }
    }

    const startDate = new Date()
    let endDate: Date

    if (syncWithMembership) {
      endDate = activeMembership.endDate
    } else if (customEndDate) {
      endDate = new Date(customEndDate)
    } else {
      endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1)
    }

    const monthsDiff = Math.max(1, Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    ))
    const totalFee = includedInPlan ? 0 : Number(locker.monthlyRate) * monthsDiff

    const assignment = await tx.lockerAssignment.create({
      data: {
        tenantId: context.tenantId!,
        branchId: context.branchId!,
        lockerId,
        memberId,
        assignedByUserId: context.userId,
        startDate,
        endDate,
        monthlyRate: locker.monthlyRate,
        totalFee: new Decimal(totalFee),
        includedInPlan,
        paymentStatus: (includedInPlan ? PaymentStatusValues.COMPLETED : PaymentStatusValues.PENDING) as any,
        securityDeposit: new Decimal(securityDeposit),
        keyNumber,
        status: LockerAssignmentStatusValues.ACTIVE as any,
        notes,
      } as any,
    })

    await tx.locker.update({
      where: { id: lockerId },
      data: {
        status: LockerStatus.OCCUPIED,
        isOccupied: true,
      },
    })

    if (!includedInPlan && totalFee > 0) {
      const currentBalanceDue = activeMembership.balanceDue ? Number(activeMembership.balanceDue) : 0
      await tx.memberMembership.update({
        where: { id: activeMembership.id },
        data: {
          balanceDue: new Decimal(currentBalanceDue + totalFee),
        },
      })
    }

    return { 
      success: true, 
      assignmentId: assignment.id,
      totalFee,
      message: includedInPlan 
        ? 'Locker assigned successfully (included in plan).'
        : `Locker assigned successfully. ₹${totalFee.toFixed(2)} added to member's balance due.`
    }
  })
}

export async function releaseLocker(lockerId: string, reason?: string) {
  const context = await requirePermission('lockers.update')
  
  return await prisma.$transaction(async (tx) => {
    const activeAssignment = await tx.lockerAssignment.findFirst({
      where: { 
        lockerId, 
        status: LockerAssignmentStatusValues.ACTIVE as any,
      },
    })

    if (activeAssignment) {
      await tx.lockerAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          status: LockerAssignmentStatusValues.TERMINATED as any,
          endDate: new Date(),
          notes: reason ? `Released: ${reason}` : 'Released by staff',
        },
      })
    }

    await tx.locker.update({
      where: { id: lockerId },
      data: {
        status: LockerStatus.AVAILABLE,
        isOccupied: false,
      },
    })

    return { success: true, message: 'Locker released successfully.' }
  })
}

export async function flagExpiredLockers() {
  const context = await requirePermission('lockers.update')
  
  const now = new Date()

  const expiredMemberships = await prisma.memberMembership.findMany({
    where: {
      member: { tenantId: context.tenantId! },
      OR: [
        { status: MembershipStatus.EXPIRED },
        { status: MembershipStatus.FROZEN },
        { endDate: { lt: now } },
      ],
    },
    select: { memberId: true },
  })

  const expiredMemberIds = expiredMemberships.map(m => m.memberId)

  if (expiredMemberIds.length === 0) {
    return { success: true, flaggedCount: 0, message: 'No expired memberships found.' }
  }

  const result = await prisma.lockerAssignment.updateMany({
    where: {
      tenantId: context.tenantId!,
      memberId: { in: expiredMemberIds },
      status: LockerAssignmentStatusValues.ACTIVE as any,
    },
    data: {
      status: LockerAssignmentStatusValues.PENDING_REVIEW as any,
    },
  })

  return { 
    success: true, 
    flaggedCount: result.count,
    message: `${result.count} locker assignment(s) flagged for review.`
  }
}

export async function getLockerAssignmentsForReview() {
  const context = await requirePermission('lockers.view')
  
  const assignments = await prisma.lockerAssignment.findMany({
    where: {
      branchId: context.branchId!,
      status: LockerAssignmentStatusValues.PENDING_REVIEW as any,
    },
    include: {
      locker: true,
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          memberships: {
            where: { status: MembershipStatus.ACTIVE },
            include: { plan: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { endDate: 'asc' },
  })

  return assignments.map(a => ({
    id: a.id,
    lockerId: a.lockerId,
    lockerNumber: a.locker.lockerNumber,
    memberId: a.memberId,
    memberName: `${a.member.firstName} ${a.member.lastName}`,
    memberPhone: a.member.phone,
    hasActiveMembership: a.member.memberships.length > 0,
    currentPlan: a.member.memberships[0]?.plan?.name || 'None',
    startDate: a.startDate.toISOString().split('T')[0],
    endDate: a.endDate.toISOString().split('T')[0],
    daysOverdue: Math.max(0, Math.floor((new Date().getTime() - a.endDate.getTime()) / (1000 * 60 * 60 * 24))),
  }))
}

export async function resolveLockerReview(assignmentId: string, action: 'extend' | 'release', newEndDate?: string) {
  const context = await requirePermission('lockers.update')
  
  return await prisma.$transaction(async (tx) => {
    const assignment = await tx.lockerAssignment.findUnique({
      where: { id: assignmentId },
      include: { locker: true },
    })

    if (!assignment) {
      throw { code: 'NOT_FOUND', message: 'Assignment not found.' }
    }

    if (action === 'release') {
      await tx.lockerAssignment.update({
        where: { id: assignmentId },
        data: {
          status: LockerAssignmentStatusValues.TERMINATED as any,
          endDate: new Date(),
          notes: 'Released after membership expiry review',
        },
      })

      await tx.locker.update({
        where: { id: assignment.lockerId },
        data: {
          status: LockerStatus.AVAILABLE,
          isOccupied: false,
        },
      })

      return { success: true, message: 'Locker released successfully.' }
    } else if (action === 'extend' && newEndDate) {
      await tx.lockerAssignment.update({
        where: { id: assignmentId },
        data: {
          status: LockerAssignmentStatusValues.ACTIVE as any,
          endDate: new Date(newEndDate),
          notes: `Extended to ${newEndDate} after review`,
        },
      })

      return { success: true, message: `Locker assignment extended to ${newEndDate}.` }
    }

    throw { code: 'INVALID_ACTION', message: 'Invalid action specified.' }
  })
}

export async function setLockerMaintenance(lockerId: string, underMaintenance: boolean, notes?: string) {
  await requirePermission('lockers.update')
  
  const locker = await prisma.locker.findUnique({
    where: { id: lockerId },
  })

  if (!locker) {
    throw { code: 'NOT_FOUND', message: 'Locker not found.' }
  }

  if (underMaintenance && locker.status === LockerStatus.OCCUPIED) {
    throw { code: 'OCCUPIED', message: 'Cannot set maintenance on an occupied locker. Release it first.' }
  }

  await prisma.locker.update({
    where: { id: lockerId },
    data: {
      status: underMaintenance ? LockerStatus.MAINTENANCE : LockerStatus.AVAILABLE,
      notes: notes || locker.notes,
    },
  })

  return { 
    success: true, 
    message: underMaintenance 
      ? 'Locker marked as under maintenance.' 
      : 'Locker maintenance completed, now available.'
  }
}

export async function getLockerStats() {
  const context = await requirePermission('lockers.view')
  
  const lockers = await prisma.locker.findMany({
    where: { branchId: context.branchId! },
  })

  const total = lockers.length
  const available = lockers.filter(l => l.status === LockerStatus.AVAILABLE).length
  const occupied = lockers.filter(l => l.status === LockerStatus.OCCUPIED).length
  const maintenance = lockers.filter(l => l.status === LockerStatus.MAINTENANCE).length
  const outOfOrder = lockers.filter(l => l.status === LockerStatus.OUT_OF_ORDER).length
  const premium = lockers.filter(l => (l as any).isPremium).length
  const premiumOccupied = lockers.filter(l => (l as any).isPremium && l.status === LockerStatus.OCCUPIED).length

  const pendingReview = await prisma.lockerAssignment.count({
    where: {
      branchId: context.branchId!,
      status: LockerAssignmentStatusValues.PENDING_REVIEW as any,
    },
  })

  return {
    total,
    available,
    occupied,
    maintenance,
    outOfOrder,
    premium,
    premiumOccupied,
    pendingReview,
    occupancyRate: total > 0 ? ((occupied / total) * 100).toFixed(1) : '0',
  }
}
