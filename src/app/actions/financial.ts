'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission, getAuthContext } from '@/libs/serverAuth'

export async function getNetProfitAnalytics(startDate: Date, endDate: Date, branchId?: string) {
  const context = await requirePermission('finance.view')

  const whereClause = branchId ? { branchId } : { tenantId: context.tenantId! }
  const dateFilter = { gte: startDate, lte: endDate }

  const [invoices, expenses, orders] = await Promise.all([
    prisma.invoice.findMany({
      where: { ...whereClause, invoiceDate: dateFilter, status: { in: ['PAID', 'PARTIALLY_PAID'] } },
      select: { totalAmount: true },
    }),
    prisma.expense.findMany({
      where: { ...whereClause, expenseDate: dateFilter },
      select: { amount: true },
    }),
    prisma.customerOrder.findMany({
      where: { ...whereClause, orderDate: dateFilter, paymentStatus: 'PAID' },
      select: { totalAmount: true },
    }),
  ])

  const membershipRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
  const orderRevenue = orders.reduce((sum, ord) => sum + Number(ord.totalAmount), 0)
  const totalRevenue = membershipRevenue + orderRevenue
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  const netProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    revenueBreakdown: {
      memberships: membershipRevenue,
      orders: orderRevenue,
    },
  }
}

export async function getARRMetrics(branchId?: string) {
  const context = await requirePermission('finance.view')

  const whereClause = branchId ? { branchId } : { tenantId: context.tenantId! }

  const activeMembers = await prisma.memberMembership.count({
    where: {
      ...whereClause,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    },
  })

  const avgMonthlyRevenue = await prisma.invoice.aggregate({
    where: {
      ...whereClause,
      invoiceDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      status: { in: ['PAID', 'PARTIALLY_PAID'] },
    },
    _sum: { totalAmount: true },
  })

  const mrr = Number(avgMonthlyRevenue._sum.totalAmount || 0)
  const arr = mrr * 12

  return {
    activeMembers,
    mrr,
    arr,
    arpu: activeMembers > 0 ? mrr / activeMembers : 0,
  }
}

export async function getMemberGrowthAnalytics(months: number = 6) {
  const context = await requirePermission('finance.view')

  const growth: { month: string; count: number }[] = []

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const count = await prisma.member.count({
      where: {
        tenantId: context.tenantId!,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    })

    growth.push({
      month: startOfMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      count,
    })
  }

  return growth
}

export async function getExpenseAnalytics(startDate: Date, endDate: Date, branchId?: string) {
  const context = await requirePermission('finance.view')

  const whereClause = branchId ? { branchId } : { tenantId: context.tenantId! }

  const expenses = await prisma.expense.findMany({
    where: { ...whereClause, expenseDate: { gte: startDate, lte: endDate } },
    include: { category: true },
  })

  const byCategory: Record<string, number> = {}
  let total = 0

  for (const expense of expenses) {
    const categoryName = expense.category?.name || 'Uncategorized'
    byCategory[categoryName] = (byCategory[categoryName] || 0) + Number(expense.amount)
    total += Number(expense.amount)
  }

  return {
    total,
    byCategory,
    count: expenses.length,
  }
}

export async function getRevenueByPlanType(startDate: Date, endDate: Date, branchId?: string) {
  const context = await requirePermission('finance.view')

  const whereClause = branchId ? { branchId } : { tenantId: context.tenantId! }

  const invoices = await prisma.invoice.findMany({
    where: {
      ...whereClause,
      invoiceDate: { gte: startDate, lte: endDate },
      status: { in: ['PAID', 'PARTIALLY_PAID'] },
    },
    include: { items: true },
  })

  const byType: Record<string, number> = {}
  let total = 0

  for (const invoice of invoices) {
    for (const item of invoice.items) {
      const type = item.itemType || 'Other'
      byType[type] = (byType[type] || 0) + Number(item.totalAmount)
      total += Number(item.totalAmount)
    }
  }

  return {
    total,
    byType,
  }
}

export async function getChurnAnalytics(months: number = 6) {
  const context = await requirePermission('finance.view')

  const churnData: { month: string; churned: number; active: number; rate: number }[] = []

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const [churned, active] = await Promise.all([
      prisma.memberMembership.count({
        where: {
          tenantId: context.tenantId!,
          endDate: { gte: startOfMonth, lte: endOfMonth },
          status: 'EXPIRED',
        },
      }),
      prisma.memberMembership.count({
        where: {
          tenantId: context.tenantId!,
          status: 'ACTIVE',
          startDate: { lte: endOfMonth },
        },
      }),
    ])

    churnData.push({
      month: startOfMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      churned,
      active,
      rate: active > 0 ? Math.round((churned / active) * 100) : 0,
    })
  }

  return churnData
}

export async function getDashboardFinanceSummary(branchId?: string) {
  const context = await requirePermission('finance.view')
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const today = new Date()

  const [profit, arr, growth, expenses] = await Promise.all([
    getNetProfitAnalytics(thirtyDaysAgo, today, branchId),
    getARRMetrics(branchId),
    getMemberGrowthAnalytics(6),
    getExpenseAnalytics(thirtyDaysAgo, today, branchId),
  ])

  return {
    profit,
    arr,
    growth,
    expenses,
  }
}
