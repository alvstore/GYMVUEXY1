'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'

export async function getStaffDashboardMetrics() {
  const context = await requirePermission('attendance.view')

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  const branchFilter = context.branchId ? { branchId: context.branchId } : {}

  const [todayCheckins, totalMembers, activeClasses, pendingCheckouts] = await Promise.all([
    prisma.attendanceRecord.count({
      where: {
        tenantId: context.tenantId,
        ...branchFilter,
        checkInTime: { gte: startOfDay, lt: endOfDay },
      },
    }),
    prisma.member.count({
      where: { tenantId: context.tenantId, ...branchFilter, status: 'ACTIVE' },
    }),
    prisma.class.count({
      where: { tenantId: context.tenantId, ...branchFilter, isActive: true },
    }),
    prisma.attendanceRecord.count({
      where: {
        tenantId: context.tenantId,
        ...branchFilter,
        checkInTime: { gte: startOfDay, lt: endOfDay },
        checkOutTime: null,
      },
    }),
  ])

  return {
    todayCheckins,
    totalMembers,
    activeClasses,
    pendingCheckouts,
  }
}

export async function getRecentCheckins() {
  const context = await requirePermission('attendance.view')

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const branchFilter = context.branchId ? { branchId: context.branchId } : {}

  const checkins = await prisma.attendanceRecord.findMany({
    where: {
      tenantId: context.tenantId,
      ...branchFilter,
      checkInTime: { gte: startOfDay },
    },
    include: {
      member: { select: { firstName: true, lastName: true, email: true, phone: true } },
    },
    orderBy: { checkInTime: 'desc' },
    take: 15,
  })

  return checkins.map((c) => ({
    id: c.id,
    memberName: c.member ? `${c.member.firstName} ${c.member.lastName}` : 'Unknown',
    email: c.member?.email || '',
    phone: c.member?.phone || '',
    checkInTime: c.checkInTime,
    checkOutTime: c.checkOutTime,
    notes: c.notes,
  }))
}

export async function getTodayClasses() {
  const context = await requirePermission('classes.view')

  const branchFilter = context.branchId ? { branchId: context.branchId } : {}

  const classes = await prisma.class.findMany({
    where: {
      tenantId: context.tenantId,
      ...branchFilter,
      isActive: true,
    },
    include: {
      trainer: { select: { user: { select: { name: true } } } },
      _count: { select: { bookings: true } },
    },
    orderBy: { startTime: 'asc' },
    take: 10,
  })

  return classes.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.classType,
    trainer: c.trainer?.user.name || 'TBD',
    capacity: c.capacity,
    enrolled: c._count.bookings,
    startTime: c.startTime,
    endTime: c.endTime,
  }))
}

export async function getQuickMemberSearch(searchTerm: string) {
  const context = await requirePermission('members.view')

  if (!searchTerm || searchTerm.length < 2) return []

  const branchFilter = context.branchId ? { branchId: context.branchId } : {}

  const members = await prisma.member.findMany({
    where: {
      tenantId: context.tenantId,
      ...branchFilter,
      OR: [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm } },
      ],
    },
    include: {
      memberships: {
        where: { status: 'ACTIVE' },
        include: { plan: { select: { name: true } } },
        take: 1,
      },
    },
    take: 10,
  })

  return members.map((m) => ({
    id: m.id,
    name: `${m.firstName} ${m.lastName}`,
    email: m.email,
    phone: m.phone,
    status: m.status,
    plan: m.memberships[0]?.plan.name || 'No active plan',
  }))
}
