'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'

export async function getManagerDashboardMetrics() {
  const context = await requirePermission('dashboard.view')

  const branchFilter = context.branchId ? { branchId: context.branchId } : {}

  const [totalMembers, activeMembers, totalRevenue, activeClasses, todayCheckins, staffCount] = await Promise.all([
    prisma.member.count({
      where: { tenantId: context.tenantId, ...branchFilter, status: 'ACTIVE' },
    }),
    prisma.member.count({
      where: {
        tenantId: context.tenantId,
        ...branchFilter,
        memberships: { some: { status: 'ACTIVE' } },
      },
    }),
    prisma.transaction.aggregate({
      where: {
        tenantId: context.tenantId,
        ...branchFilter,
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
    prisma.class.count({
      where: { tenantId: context.tenantId, ...branchFilter, isActive: true },
    }),
    prisma.attendanceRecord.count({
      where: {
        tenantId: context.tenantId,
        ...branchFilter,
        checkInTime: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
          lt: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1),
        },
      },
    }),
    prisma.staffMember.count({
      where: { tenantId: context.tenantId, ...branchFilter, status: 'ACTIVE' },
    }),
  ])

  return {
    totalMembers,
    activeMembers,
    totalRevenue: Number(totalRevenue?._sum?.amount || 0),
    activeClasses,
    todayCheckins,
    staffCount,
  }
}

export async function getStaffList() {
  const context = await requirePermission('staff.view')

  const branchFilter = context.branchId ? { branchId: context.branchId } : {}

  const staff = await prisma.staffMember.findMany({
    where: { tenantId: context.tenantId, ...branchFilter, status: 'ACTIVE' },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return staff.map((s) => ({
    id: s.id,
    employeeId: s.employeeId,
    name: s.user?.name || `${s.firstName} ${s.lastName}`,
    email: s.user?.email || s.email,
    avatar: s.user?.image,
    role: s.role,
    department: s.department,
    phone: s.phone,
    joinDate: s.joinDate,
  }))
}

export async function getClassScheduleOverview() {
  const context = await requirePermission('classes.view')

  const branchFilter = context.branchId ? { branchId: context.branchId } : {}

  const classes = await prisma.class.findMany({
    where: { tenantId: context.tenantId, ...branchFilter, isActive: true },
    include: {
      trainer: { select: { user: { select: { name: true } } } },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  return classes.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.classType,
    trainer: c.trainer?.user.name || 'TBD',
    capacity: c.capacity,
    bookings: c._count.bookings,
    description: c.description,
  }))
}

export async function getMembershipRenewalAlerts() {
  const context = await requirePermission('dashboard.view')

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const branchFilter = context.branchId ? { branchId: context.branchId } : {}

  const expiringMemberships = await prisma.memberMembership.findMany({
    where: {
      ...branchFilter,
      status: 'ACTIVE',
      endDate: {
        lte: thirtyDaysFromNow,
        gt: new Date(),
      },
      member: {
        tenantId: context.tenantId,
      },
    },
    include: {
      member: { select: { firstName: true, lastName: true, email: true, phone: true } },
      plan: { select: { name: true } },
    },
    orderBy: { endDate: 'asc' },
    take: 5,
  })

  return expiringMemberships.map((m) => ({
    id: m.id,
    memberName: `${m.member.firstName} ${m.member.lastName}`,
    email: m.member.email,
    plan: m.plan.name,
    expiresIn: Math.ceil((m.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
  }))
}
