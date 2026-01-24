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
    prisma.order.count({
      where: {
        tenantId: context.tenantId,
        ...(context.branchId && { branchId: context.branchId }),
        status: 'completed',
        createdAt: { gte: thirtyDaysAgo },
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

  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true, totalPrice: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  })

  if (topProducts.length === 0) {
    return []
  }

  const productIds = topProducts.map((p) => p.productId)
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
    const product = productMap.get(item.productId)
    return {
      id: item.productId,
      name: product?.name || 'Unknown Product',
      sku: product?.sku || '',
      imageUrl: product?.imageUrl,
      price: Number(product?.sellingPrice || 0),
      totalSold: item._sum.quantity || 0,
      totalRevenue: Number(item._sum.totalPrice || 0),
    }
  })
}

export async function getRecentOrders(limit = 10) {
  const context = await requirePermission('dashboard.view')

  const orders = await prisma.order.findMany({
    where: {
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    include: {
      member: { select: { firstName: true, lastName: true } },
      branch: { select: { name: true } },
      orderItems: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    memberName: order.member ? `${order.member.firstName} ${order.member.lastName}` : 'Walk-in',
    branch: order.branch?.name || 'Unknown',
    totalAmount: Number(order.grandTotal || 0),
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    itemCount: order.orderItems.length,
    createdAt: order.createdAt,
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
