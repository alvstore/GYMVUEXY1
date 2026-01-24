'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'

export async function getEcommerceStatistics() {
  const context = await requirePermission('dashboard.view')
  
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalSales,
    totalCustomers,
    totalProducts,
    totalRevenue,
  ] = await Promise.all([
    prisma.invoice.count({
      where: {
        tenantId: context.tenantId,
        ...(context.branchId && { branchId: context.branchId }),
        status: 'PAID',
        issueDate: { gte: thirtyDaysAgo },
      },
    }),
    prisma.member.count({
      where: {
        tenantId: context.tenantId,
        ...(context.branchId && { branchId: context.branchId }),
      },
    }),
    prisma.product.count({
      where: {
        tenantId: context.tenantId,
        ...(context.branchId && { branchId: context.branchId }),
        isActive: true,
      },
    }),
    prisma.transaction.aggregate({
      where: {
        tenantId: context.tenantId,
        ...(context.branchId && { branchId: context.branchId }),
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { amount: true },
    }),
  ])

  return {
    totalSales,
    totalCustomers,
    totalProducts,
    totalRevenue: Number(totalRevenue._sum.amount || 0),
    period: '30 days',
  }
}

export async function getPopularProducts(limit = 6) {
  const context = await requirePermission('dashboard.view')

  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
      status: 'PAID',
    },
    select: { id: true },
  })

  if (invoices.length === 0) {
    return []
  }

  const invoiceIds = invoices.map((inv) => inv.id)

  const topProducts = await prisma.invoiceItem.groupBy({
    by: ['productId'],
    where: {
      invoiceId: { in: invoiceIds },
      productId: { not: null },
    },
    _sum: { quantity: true, totalAmount: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  })

  if (topProducts.length === 0) {
    return []
  }

  const productIds = topProducts
    .map((p) => p.productId)
    .filter((id): id is string => id !== null)
  
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      tenantId: context.tenantId,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      sellingPrice: true,
      imageUrl: true,
    },
  })

  const productMap = new Map(products.map((p) => [p.id, p]))

  return topProducts.map((item) => {
    const product = item.productId ? productMap.get(item.productId) : null
    return {
      id: item.productId || '',
      name: product?.name || 'Unknown Product',
      sku: product?.sku || '',
      imageUrl: product?.imageUrl,
      price: Number(product?.sellingPrice || 0),
      totalSold: item._sum.quantity || 0,
      totalRevenue: Number(item._sum.totalAmount || 0),
    }
  })
}

export async function getRecentInvoices(limit = 10) {
  const context = await requirePermission('dashboard.view')

  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    include: {
      member: { select: { firstName: true, lastName: true } },
      branch: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { issueDate: 'desc' },
    take: limit,
  })

  return invoices.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    memberName: invoice.member 
      ? `${invoice.member.firstName} ${invoice.member.lastName}` 
      : invoice.customerName || 'Walk-in',
    branch: invoice.branch?.name || 'Unknown',
    totalAmount: Number(invoice.totalAmount || 0),
    status: invoice.status,
    paymentMethod: invoice.paymentMethod,
    itemCount: invoice.items.length,
    issueDate: invoice.issueDate,
  }))
}

export async function getRecentTransactions(limit = 10) {
  const context = await requirePermission('dashboard.view')

  const transactions = await prisma.transaction.findMany({
    where: {
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
      status: 'COMPLETED',
    },
    include: {
      member: { select: { firstName: true, lastName: true } },
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return transactions.map((t) => ({
    id: t.id,
    amount: Number(t.amount || 0),
    type: t.transactionType,
    paymentMethod: t.paymentMethod,
    memberName: t.member ? `${t.member.firstName} ${t.member.lastName}` : 'Unknown',
    branch: t.branch?.name || 'Unknown',
    createdAt: t.createdAt,
  }))
}
