'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'

export async function getFinanceDashboard(filters?: {
  startDate?: Date
  endDate?: Date
  branchId?: string
}) {
  const context = await requirePermission('finance.view')

  const startDate = filters?.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const endDate = filters?.endDate || new Date()

  const branchFilter = context.branchId || filters?.branchId

  const where: any = {
    tenantId: context.tenantId,
    ...(branchFilter && { branchId: branchFilter }),
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }

  const [revenue, expenses, invoices, orders] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        ...where,
        type: 'income',
      },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    }),
    prisma.invoice.findMany({
      where: {
        tenantId: context.tenantId,
        ...(branchFilter && { branchId: branchFilter }),
      },
      select: {
        status: true,
        totalAmount: true,
        paidAmount: true,
        invoiceDate: true,
        dueDate: true,
      },
    }),
    prisma.order.aggregate({
      where,
      _sum: { grandTotal: true },
      _count: true,
    }),
  ])

  const totalRevenue = (revenue._sum.amount || 0) + (orders._sum.grandTotal || 0)
  const totalExpenses = expenses._sum.amount || 0
  const netIncome = totalRevenue - totalExpenses

  const paidInvoices = invoices.filter((inv) => inv.status === 'paid')
  const unpaidInvoices = invoices.filter((inv) => inv.status === 'sent')
  const overdueInvoices = unpaidInvoices.filter((inv) => new Date(inv.dueDate) < new Date())

  const totalReceivables = unpaidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

  const arAging = calculateARAging(unpaidInvoices)

  return {
    totalRevenue,
    totalExpenses,
    netIncome,
    totalOrders: orders._count,
    totalInvoices: invoices.length,
    paidInvoices: paidInvoices.length,
    unpaidInvoices: unpaidInvoices.length,
    overdueInvoices: overdueInvoices.length,
    totalReceivables,
    arAging,
  }
}

function calculateARAging(invoices: any[]) {
  const now = new Date()
  const aging = {
    current: 0,
    days0_30: 0,
    days31_60: 0,
    days61_90: 0,
    days90Plus: 0,
  }

  invoices.forEach((inv) => {
    const daysOverdue = Math.floor(
      (now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    const amount = inv.totalAmount - (inv.paidAmount || 0)

    if (daysOverdue <= 0) {
      aging.current += amount
    } else if (daysOverdue <= 30) {
      aging.days0_30 += amount
    } else if (daysOverdue <= 60) {
      aging.days31_60 += amount
    } else if (daysOverdue <= 90) {
      aging.days61_90 += amount
    } else {
      aging.days90Plus += amount
    }
  })

  return aging
}

export async function exportGSTReport(filters?: {
  startDate?: Date
  endDate?: Date
  branchId?: string
}) {
  const context = await requirePermission('finance.export')

  const startDate = filters?.startDate || new Date(new Date().getFullYear(), 0, 1)
  const endDate = filters?.endDate || new Date()

  const [invoices, orders] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        tenantId: context.tenantId,
        ...(context.branchId && { branchId: context.branchId }),
        ...(filters?.branchId && { branchId: filters.branchId }),
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        member: { select: { firstName: true, lastName: true, email: true } },
        invoiceItems: true,
      },
    }),
    prisma.order.findMany({
      where: {
        tenantId: context.tenantId,
        ...(context.branchId && { branchId: context.branchId }),
        ...(filters?.branchId && { branchId: filters.branchId }),
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        member: { select: { firstName: true, lastName: true } },
        orderItems: { include: { product: true } },
      },
    }),
  ])

  const gstData = [
    ...invoices.map((inv) => ({
      type: 'Invoice',
      number: inv.invoiceNumber,
      date: inv.invoiceDate,
      customer: inv.member ? `${inv.member.firstName} ${inv.member.lastName}` : 'N/A',
      subtotal: inv.subtotal,
      gst: inv.taxAmount,
      total: inv.totalAmount,
    })),
    ...orders.map((order) => ({
      type: 'Order',
      number: order.orderNumber,
      date: order.createdAt,
      customer: order.member ? `${order.member.firstName} ${order.member.lastName}` : 'Walk-in',
      subtotal: order.totalAmount,
      gst: order.taxAmount,
      total: order.grandTotal,
    })),
  ]

  const totals = {
    totalSubtotal: gstData.reduce((sum, item) => sum + item.subtotal, 0),
    totalGST: gstData.reduce((sum, item) => sum + item.gst, 0),
    totalAmount: gstData.reduce((sum, item) => sum + item.total, 0),
  }

  return {
    data: gstData,
    totals,
    period: { startDate, endDate },
  }
}

export async function getCategories(filters?: {
  categoryType?: 'INCOME' | 'EXPENSE'
  branchId?: string
  includeInactive?: boolean
}) {
  const context = await requirePermission('finance.view')

  const where: any = {
    tenantId: context.tenantId,
    ...(!filters?.includeInactive && { isActive: true }),
  }

  if (filters?.categoryType) {
    where.categoryType = filters.categoryType
  }

  if (context.branchId) {
    where.OR = [{ branchId: context.branchId }, { branchId: null }]
  } else if (filters?.branchId) {
    where.branchId = filters.branchId
  }

  const childrenWhere: any = {}
  if (!filters?.includeInactive) {
    childrenWhere.isActive = true
  }

  const categories = await prisma.financeCategory.findMany({
    where,
    include: {
      parent: true,
      children: {
        where: childrenWhere,
      },
      _count: {
        select: {
          expenses: true,
        },
      },
    },
    orderBy: [{ categoryType: 'asc' }, { name: 'asc' }],
  })

  return categories
}

export async function getCategory(categoryId: string) {
  const context = await requirePermission('finance.view')

  const category = await prisma.financeCategory.findFirst({
    where: {
      id: categoryId,
      tenantId: context.tenantId,
    },
    include: {
      parent: true,
      children: true,
      _count: {
        select: {
          expenses: true,
        },
      },
    },
  })

  if (!category) {
    throw new Error('Category not found')
  }

  return category
}

export async function createCategory(data: {
  name: string
  description?: string
  categoryType: 'INCOME' | 'EXPENSE'
  parentId?: string
  color?: string
  icon?: string
  branchId?: string
}) {
  const context = await requirePermission('finance.manage')

  let assignedBranchId = context.branchId

  if (data.branchId) {
    if (context.branchId && data.branchId !== context.branchId) {
      throw new Error('Cannot create category for a different branch')
    }
    assignedBranchId = data.branchId
  }

  if (data.parentId) {
    const parentWhere: any = {
      id: data.parentId,
      tenantId: context.tenantId,
    }

    if (context.branchId) {
      parentWhere.OR = [{ branchId: context.branchId }, { branchId: null }]
    }

    const parent = await prisma.financeCategory.findFirst({
      where: parentWhere,
    })

    if (!parent) {
      throw new Error('Parent category not found or access denied')
    }

    if (parent.categoryType !== data.categoryType) {
      throw new Error('Parent category must be of the same type')
    }
  }

  const category = await prisma.financeCategory.create({
    data: {
      name: data.name,
      description: data.description,
      categoryType: data.categoryType,
      parentId: data.parentId,
      color: data.color,
      icon: data.icon,
      branchId: assignedBranchId,
      tenantId: context.tenantId,
    },
    include: {
      parent: true,
    },
  })

  return category
}

export async function updateCategory(
  categoryId: string,
  data: {
    name?: string
    description?: string
    parentId?: string
    color?: string
    icon?: string
    isActive?: boolean
  }
) {
  const context = await requirePermission('finance.manage')

  const existingWhere: any = {
    id: categoryId,
    tenantId: context.tenantId,
  }

  if (context.branchId) {
    existingWhere.OR = [{ branchId: context.branchId }, { branchId: null }]
  }

  const existing = await prisma.financeCategory.findFirst({
    where: existingWhere,
  })

  if (!existing) {
    throw new Error('Category not found or access denied')
  }

  if (data.parentId) {
    if (data.parentId === categoryId) {
      throw new Error('Category cannot be its own parent')
    }

    const parentWhere: any = {
      id: data.parentId,
      tenantId: context.tenantId,
    }

    if (context.branchId) {
      parentWhere.OR = [{ branchId: context.branchId }, { branchId: null }]
    }

    const parent = await prisma.financeCategory.findFirst({
      where: parentWhere,
    })

    if (!parent) {
      throw new Error('Parent category not found or access denied')
    }

    if (parent.categoryType !== existing.categoryType) {
      throw new Error('Parent category must be of the same type')
    }
  }

  const category = await prisma.financeCategory.update({
    where: { id: categoryId },
    data: {
      name: data.name,
      description: data.description,
      parentId: data.parentId,
      color: data.color,
      icon: data.icon,
      isActive: data.isActive,
    },
    include: {
      parent: true,
      children: true,
    },
  })

  return category
}

export async function archiveCategory(categoryId: string) {
  const context = await requirePermission('finance.manage')

  const where: any = {
    id: categoryId,
    tenantId: context.tenantId,
  }

  if (context.branchId) {
    where.OR = [{ branchId: context.branchId }, { branchId: null }]
  }

  const category = await prisma.financeCategory.findFirst({
    where,
    include: {
      _count: {
        select: {
          expenses: true,
          children: true,
        },
      },
    },
  })

  if (!category) {
    throw new Error('Category not found or access denied')
  }

  if (category._count.expenses > 0) {
    throw new Error(
      `Cannot archive category with ${category._count.expenses} expense(s). Reassign expenses first.`
    )
  }

  if (category._count.children > 0) {
    throw new Error(
      `Cannot archive category with ${category._count.children} subcategory(ies). Archive or reassign them first.`
    )
  }

  await prisma.financeCategory.update({
    where: { id: categoryId },
    data: { isActive: false },
  })

  return { success: true }
}

export async function restoreCategory(categoryId: string) {
  const context = await requirePermission('finance.manage')

  const where: any = {
    id: categoryId,
    tenantId: context.tenantId,
  }

  if (context.branchId) {
    where.OR = [{ branchId: context.branchId }, { branchId: null }]
  }

  const category = await prisma.financeCategory.findFirst({
    where,
  })

  if (!category) {
    throw new Error('Category not found or access denied')
  }

  await prisma.financeCategory.update({
    where: { id: categoryId },
    data: { isActive: true },
  })

  return { success: true }
}
