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
        include: { plan: true },
        take: 1,
      },
      goals: {
        where: { status: 'ACTIVE' },
        select: { id: true, goalType: true, currentValue: true, targetValue: true, status: true },
      },
      attendanceRecords: {
        orderBy: { checkInTime: 'desc' },
        take: 5,
      },
    },
  })

  if (!member) {
    throw new Error('Member not found')
  }

  return {
    id: member.id,
    name: `${member.firstName} ${member.lastName}`,
    email: member.email,
    phone: member.phone,
    joinDate: member.createdAt,
    avatar: member.avatarUrl,
    activeMembership: member.memberships[0]
      ? {
          id: member.memberships[0].id,
          planName: member.memberships[0].plan.name,
          startDate: member.memberships[0].startDate,
          endDate: member.memberships[0].endDate,
          daysRemaining: Math.ceil(
            (member.memberships[0].endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          ),
        }
      : null,
    goals: member.goals,
    recentAttendance: member.attendanceRecords,
  }
}

export async function getAvailableClasses(limit = 10) {
  const context = await requirePermission('classes.view')

  const classes = await prisma.class.findMany({
    where: { branchId: context.branchId, isActive: true },
    include: {
      trainer: { select: { user: { select: { name: true } } } },
      classSchedules: {
        where: {
          date: { gte: new Date() },
        },
        orderBy: { date: 'asc' },
        take: 3,
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
    trainer: c.trainer?.user.name,
    capacity: c.capacity,
    enrolled: c._count.bookings,
    description: c.description,
    nextSessions: c.classSchedules.map((cs) => ({
      id: cs.id,
      date: cs.date,
    })),
  }))
}

export async function bookClass(memberId: string, classScheduleId: string) {
  const context = await requirePermission('classes.book')

  const booking = await prisma.classBooking.create({
    data: {
      memberId,
      classScheduleId,
      bookingDate: new Date(),
      status: 'CONFIRMED',
    },
  })

  return { success: true, booking }
}

export async function cancelClassBooking(bookingId: string) {
  const context = await requirePermission('classes.book')

  await prisma.classBooking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED' },
  })

  return { success: true }
}

export async function getMemberGoals(memberId: string) {
  const context = await requirePermission('self.view')

  const goals = await prisma.memberGoal.findMany({
    where: { memberId, status: 'ACTIVE' },
  })

  return goals.map((g) => ({
    id: g.id,
    type: g.goalType,
    current: g.currentValue || 0,
    target: g.targetValue || 0,
    progress: g.targetValue ? ((g.currentValue || 0) / g.targetValue) * 100 : 0,
  }))
}

export async function updateGoalProgress(goalId: string, currentValue: number) {
  const context = await requirePermission('self.update')

  const goal = await prisma.memberGoal.update({
    where: { id: goalId },
    data: { currentValue },
  })

  return { success: true, goal }
}

export async function getMemberAttendanceHistory(memberId: string, limit = 20) {
  const attendance = await prisma.attendanceRecord.findMany({
    where: { memberId },
    orderBy: { checkInTime: 'desc' },
    take: limit,
  })

  return attendance.map((a) => ({
    id: a.id,
    checkInTime: a.checkInTime,
    notes: a.notes,
  }))
}
