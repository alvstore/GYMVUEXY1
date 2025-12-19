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

export async function getLeadPipelineMetrics() {
  const context = await requirePermission('dashboard.view')

  try {
    const leadCounts = await (prisma as any).lead.groupBy({
      by: ['stage'],
      where: { tenantId: context.tenantId },
      _count: { id: true },
    })

    const stageMap: Record<string, number> = {}
    leadCounts.forEach((lc: { stage: string; _count: { id: number } }) => {
      stageMap[lc.stage] = lc._count.id
    })

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [totalLeads, convertedLeads, newLeadsThisMonth] = await Promise.all([
      (prisma as any).lead.count({ where: { tenantId: context.tenantId } }),
      (prisma as any).lead.count({ where: { tenantId: context.tenantId, stage: 'CONVERTED' } }),
      (prisma as any).lead.count({ 
        where: { 
          tenantId: context.tenantId, 
          createdAt: { gte: thirtyDaysAgo } 
        } 
      }),
    ])

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0

    return {
      funnel: {
        new: stageMap['NEW'] || 0,
        contacted: stageMap['CONTACTED'] || 0,
        qualified: stageMap['QUALIFIED'] || 0,
        proposal: stageMap['PROPOSAL'] || 0,
        negotiation: stageMap['NEGOTIATION'] || 0,
        won: stageMap['CONVERTED'] || 0,
        lost: stageMap['LOST'] || 0,
      },
      totalLeads,
      convertedLeads,
      newLeadsThisMonth,
      conversionRate,
    }
  } catch {
    return {
      funnel: { new: 0, contacted: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0 },
      totalLeads: 0,
      convertedLeads: 0,
      newLeadsThisMonth: 0,
      conversionRate: 0,
    }
  }
}

export async function getMemberGrowthData() {
  const context = await requirePermission('dashboard.view')

  const now = new Date()
  const monthsData = []

  for (let i = 5; i >= 0; i--) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

    const newMembers = await prisma.member.count({
      where: {
        tenantId: context.tenantId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    })

    const totalMembers = await prisma.member.count({
      where: {
        tenantId: context.tenantId,
        createdAt: { lte: endOfMonth },
      },
    })

    monthsData.push({
      month: startOfMonth.toLocaleString('en-US', { month: 'short' }),
      newMembers,
      totalMembers,
    })
  }

  return monthsData
}

export async function getSalesAnalytics() {
  const context = await requirePermission('dashboard.view')

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    membershipRevenue,
    productRevenue,
    totalTransactions,
    recentTransactions,
    paymentMethodBreakdown,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        tenantId: context.tenantId,
        status: 'COMPLETED',
        transactionType: 'MEMBERSHIP',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: {
        tenantId: context.tenantId,
        status: 'COMPLETED',
        transactionType: 'PRODUCT_SALE',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.count({
      where: {
        tenantId: context.tenantId,
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.transaction.findMany({
      where: {
        tenantId: context.tenantId,
        status: 'COMPLETED',
      },
      include: {
        member: { select: { firstName: true, lastName: true } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where: {
        tenantId: context.tenantId,
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  const membershipCount = typeof membershipRevenue._count === 'number' 
    ? membershipRevenue._count 
    : (membershipRevenue._count as any)?._all || 0
  const productCount = typeof productRevenue._count === 'number'
    ? productRevenue._count
    : (productRevenue._count as any)?._all || 0

  return {
    membershipRevenue: Number(membershipRevenue._sum?.amount || 0),
    membershipCount,
    productRevenue: Number(productRevenue._sum?.amount || 0),
    productCount,
    totalTransactions,
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount || 0),
      type: t.transactionType,
      paymentMethod: t.paymentMethod,
      memberName: t.member ? `${t.member.firstName} ${t.member.lastName}` : 'Unknown',
      branch: t.branch?.name || 'Unknown',
      date: t.createdAt,
    })),
    paymentBreakdown: paymentMethodBreakdown.map((pm) => {
      const count = typeof pm._count === 'number' ? pm._count : (pm._count as any)?._all || 0
      return {
        method: pm.paymentMethod,
        amount: Number(pm._sum?.amount || 0),
        count,
      }
    }),
  }
}
