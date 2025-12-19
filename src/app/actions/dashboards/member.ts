'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'

export async function getMemberPortalData(memberId: string) {
  const context = await requirePermission('self.view')

  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId: context.tenantId },
    include: {
      memberships: {
        where: { status: 'ACTIVE' },
        include: { 
          plan: {
            include: {
              benefits: {
                where: { isActive: true },
                select: {
                  id: true,
                  name: true,
                  description: true,
                  benefitType: true,
                  accrualQuantity: true,
                  accrualType: true,
                }
              }
            }
          } 
        },
        take: 1,
      },
      goals: {
        where: { status: 'ACTIVE' },
        select: { 
          id: true, 
          goalType: true, 
          title: true,
          progress: true,
          targetDate: true,
          status: true 
        },
      },
      attendanceRecords: {
        orderBy: { checkInTime: 'desc' },
        take: 5,
        select: {
          id: true,
          checkInTime: true,
          checkOutTime: true,
          notes: true,
        }
      },
      benefitBalances: {
        where: { currentBalance: { gt: 0 } },
        include: {
          benefit: { select: { name: true, benefitType: true } }
        }
      }
    },
  })

  if (!member) {
    throw new Error('Member not found')
  }

  const activeMembership = member.memberships[0]

  return {
    id: member.id,
    name: `${member.firstName} ${member.lastName}`,
    email: member.email,
    phone: member.phone,
    joinDate: member.createdAt,
    avatar: member.avatarUrl,
    activeMembership: activeMembership
      ? {
          id: activeMembership.id,
          planName: activeMembership.plan.name,
          planDescription: activeMembership.plan.description,
          startDate: activeMembership.startDate,
          endDate: activeMembership.endDate,
          daysRemaining: Math.ceil(
            (activeMembership.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          ),
          features: activeMembership.plan.features,
          benefits: activeMembership.plan.benefits.map(b => ({
            id: b.id,
            name: b.name,
            description: b.description,
            type: b.benefitType,
            quantity: b.accrualQuantity,
            accrualType: b.accrualType,
          })),
          gymAccess: activeMembership.plan.gymAccess,
          poolAccess: activeMembership.plan.poolAccess,
          lockerAccess: activeMembership.plan.lockerAccess,
          personalTrainer: activeMembership.plan.personalTrainer,
          groupClasses: activeMembership.plan.groupClasses,
        }
      : null,
    goals: member.goals.map(g => ({
      id: g.id,
      type: g.goalType,
      title: g.title,
      progress: g.progress,
      targetDate: g.targetDate,
      status: g.status,
    })),
    recentAttendance: member.attendanceRecords.map(a => ({
      id: a.id,
      checkIn: a.checkInTime,
      checkOut: a.checkOutTime,
      notes: a.notes,
    })),
    benefitBalances: member.benefitBalances.map(b => ({
      id: b.id,
      name: b.benefit.name,
      type: b.benefit.benefitType,
      balance: b.currentBalance,
      totalAccrued: b.totalAccrued,
      totalConsumed: b.totalConsumed,
    })),
  }
}

export async function getAvailableClasses(limit = 10) {
  const context = await requirePermission('self.view')

  const branchFilter = context.branchId ? { branchId: context.branchId } : {}

  const classes = await prisma.class.findMany({
    where: { 
      tenantId: context.tenantId,
      ...branchFilter, 
      isActive: true 
    },
    include: {
      trainer: { 
        include: {
          user: { select: { name: true } } 
        }
      },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return classes.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.classType,
    trainer: c.trainer?.user?.name || 'TBD',
    capacity: c.capacity,
    enrolled: c._count.bookings,
    description: c.description,
  }))
}

export async function bookClass(memberId: string, classId: string, scheduleId: string) {
  const context = await requirePermission('self.view')

  const classInfo = await prisma.class.findFirst({
    where: { id: classId, tenantId: context.tenantId }
  })

  if (!classInfo) {
    throw new Error('Class not found')
  }

  const booking = await prisma.classBooking.create({
    data: {
      tenantId: context.tenantId,
      branchId: classInfo.branchId,
      memberId,
      classId,
      scheduleId,
      status: 'CONFIRMED',
    },
  })

  return { success: true, bookingId: booking.id }
}

export async function cancelClassBooking(bookingId: string) {
  const context = await requirePermission('self.view')

  await prisma.classBooking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED' },
  })

  return { success: true }
}

export async function getMemberGoals(memberId: string) {
  const context = await requirePermission('self.view')

  const goals = await prisma.memberGoal.findMany({
    where: { memberId, tenantId: context.tenantId },
    orderBy: { createdAt: 'desc' },
  })

  return goals.map((g) => ({
    id: g.id,
    type: g.goalType,
    title: g.title,
    description: g.description,
    progress: g.progress,
    targetDate: g.targetDate,
    status: g.status,
  }))
}

export async function updateGoalProgress(goalId: string, progress: number) {
  const context = await requirePermission('self.view')

  await prisma.memberGoal.update({
    where: { id: goalId },
    data: { 
      progress: Math.min(100, Math.max(0, progress)),
      status: progress >= 100 ? 'ACHIEVED' : 'ACTIVE',
      achievedDate: progress >= 100 ? new Date() : null,
    },
  })

  return { success: true }
}

export async function getMemberAttendanceHistory(memberId: string, limit = 10) {
  const context = await requirePermission('self.view')

  const records = await prisma.attendanceRecord.findMany({
    where: { memberId, tenantId: context.tenantId },
    orderBy: { checkInTime: 'desc' },
    take: limit,
    select: {
      id: true,
      checkInTime: true,
      checkOutTime: true,
      notes: true,
    }
  })

  return records.map((r) => ({
    id: r.id,
    checkIn: r.checkInTime,
    checkOut: r.checkOutTime,
    notes: r.notes,
  }))
}

export async function getMembershipPlans() {
  const context = await requirePermission('self.view')

  const branchFilter = context.branchId ? { 
    OR: [
      { branchId: context.branchId },
      { branchId: null }
    ]
  } : {}

  const plans = await prisma.membershipPlan.findMany({
    where: { 
      tenantId: context.tenantId,
      status: 'ACTIVE',
      ...branchFilter,
    },
    include: {
      benefits: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          benefitType: true,
          accrualQuantity: true,
          accrualType: true,
        }
      }
    },
    orderBy: { price: 'asc' },
  })

  return plans.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    duration: p.duration,
    price: Number(p.price),
    setupFee: Number(p.setupFee),
    features: p.features,
    benefits: p.benefits.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      type: b.benefitType,
      quantity: b.accrualQuantity,
    })),
    gymAccess: p.gymAccess,
    poolAccess: p.poolAccess,
    lockerAccess: p.lockerAccess,
    personalTrainer: p.personalTrainer,
    groupClasses: p.groupClasses,
  }))
}
