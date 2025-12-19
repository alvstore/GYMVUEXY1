'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'

export async function getAdminDashboardMetrics() {
  const context = await requirePermission('dashboard.view')

  const [
    totalBranches,
    totalMembers,
    totalStaff,
    activeMembers,
    totalRevenue,
  ] = await Promise.all([
    prisma.branch.count({ where: { tenantId: context.tenantId } }),
    prisma.member.count({ where: { tenantId: context.tenantId } }),
    prisma.staffMember.count({ where: { tenantId: context.tenantId } }),
    prisma.member.count({ where: { tenantId: context.tenantId, status: 'ACTIVE' } }),
    prisma.transaction.aggregate({
      where: { 
        tenantId: context.tenantId,
        status: 'COMPLETED',
        createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
      },
      _sum: { amount: true }
    }),
  ])

  return {
    totalBranches,
    totalMembers,
    totalStaff,
    activeMembers,
    monthlyRevenue: Number(totalRevenue._sum.amount || 0),
  }
}

export async function getAllBranches() {
  const context = await requirePermission('dashboard.view')

  const branches = await prisma.branch.findMany({
    where: { tenantId: context.tenantId },
    orderBy: { createdAt: 'desc' },
  })

  const branchData = await Promise.all(
    branches.map(async (branch) => {
      const [memberCount, staffCount, classCount] = await Promise.all([
        prisma.member.count({ where: { branchId: branch.id, tenantId: context.tenantId } }),
        prisma.staffMember.count({ where: { branchId: branch.id, tenantId: context.tenantId } }),
        prisma.class.count({ where: { branchId: branch.id, tenantId: context.tenantId } }),
      ])
      
      return {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        address: branch.address,
        city: branch.city,
        phone: branch.phone,
        email: branch.email,
        isActive: branch.isActive,
        memberCount,
        staffCount,
        classCount,
        createdAt: branch.createdAt,
      }
    })
  )

  return branchData
}

export async function getAllUsers() {
  const context = await requirePermission('dashboard.view')

  const users = await prisma.user.findMany({
    where: { tenantId: context.tenantId },
    include: {
      roleAssignments: {
        include: {
          role: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    isActive: u.isActive,
    roles: u.roleAssignments.map((ra) => ra.role.name),
    createdAt: u.createdAt,
  }))
}

export async function getBranchStats() {
  const context = await requirePermission('dashboard.view')

  const branches = await prisma.branch.findMany({
    where: { tenantId: context.tenantId, isActive: true },
  })

  const branchRevenue = await Promise.all(
    branches.map(async (branch) => {
      const [memberCount, revenue] = await Promise.all([
        prisma.member.count({ where: { branchId: branch.id, tenantId: context.tenantId } }),
        prisma.transaction.aggregate({
          where: {
            branchId: branch.id,
            tenantId: context.tenantId,
            status: 'COMPLETED',
            createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
          },
          _sum: { amount: true }
        })
      ])
      return {
        branchId: branch.id,
        branchName: branch.name,
        memberCount,
        revenue: Number(revenue._sum.amount || 0),
      }
    })
  )

  return branchRevenue
}

export async function getRecentActivity() {
  const context = await requirePermission('dashboard.view')

  const [recentMembers, recentPayments] = await Promise.all([
    prisma.member.findMany({
      where: { tenantId: context.tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        branch: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.transaction.findMany({
      where: { tenantId: context.tenantId, status: 'COMPLETED' },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        member: { select: { firstName: true, lastName: true } },
        branch: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  return {
    recentMembers: recentMembers.map((m: { id: string; firstName: string; lastName: string; createdAt: Date; branch: { name: string } | null }) => ({
      id: m.id,
      name: `${m.firstName} ${m.lastName}`,
      branch: m.branch?.name || 'Unassigned',
      date: m.createdAt,
    })),
    recentPayments: recentPayments.map((p: { id: string; amount: any; createdAt: Date; member: { firstName: string; lastName: string } | null; branch: { name: string } | null }) => ({
      id: p.id,
      memberName: p.member ? `${p.member.firstName} ${p.member.lastName}` : 'Unknown',
      amount: Number(p.amount || 0),
      branch: p.branch?.name || 'Unknown',
      date: p.createdAt,
    })),
  }
}
