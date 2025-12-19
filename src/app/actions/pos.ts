'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'

export async function createSale(data: {
  memberId?: string
  items: Array<{
    productId: string
    quantity: number
    price: number
    discount?: number
  }>
  paymentMethod: string
  paymentStatus: string
  notes?: string
}) {
  const context = await requirePermission('pos.create')
  const branchId = context.branchId || ''

  const total = data.items.reduce(
    (sum, item) => sum + item.quantity * item.price * (1 - (item.discount || 0) / 100),
    0
  )
  const gst = total * 0.18
  const grandTotal = total + gst

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        tenantId: context.tenantId,
        branchId,
        memberId: data.memberId || null,
        orderNumber: `ORD${Date.now().toString().slice(-8)}`,
        orderType: data.memberId ? 'member' : 'walk-in',
        status: 'completed',
        totalAmount: total,
        taxAmount: gst,
        grandTotal,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        notes: data.notes,
        createdBy: context.userId,
      },
    })

    for (const item of data.items) {
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
          discount: item.discount || 0,
          totalPrice: item.quantity * item.price * (1 - (item.discount || 0) / 100),
        },
      })

      await tx.product.update({
        where: {
          id: item.productId,
          tenantId: context.tenantId,
          ...(branchId && { branchId }),
        },
        data: {
          stock: { decrement: item.quantity },
        },
      })

      await tx.inventoryMovement.create({
        data: {
          tenantId: context.tenantId,
          branchId,
          productId: item.productId,
          movementType: 'sale',
          quantity: -item.quantity,
          referenceType: 'order',
          referenceId: newOrder.id,
          createdBy: context.userId,
        },
      })
    }

    return newOrder
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId,
    action: 'CREATE',
    entity: 'Order',
    entityId: order.id,
    metadata: { orderType: 'pos', total: grandTotal },
  })

  return order
}

export async function getSales(filters?: {
  startDate?: Date
  endDate?: Date
  branchId?: string
  paymentMethod?: string
  page?: number
  limit?: number
}) {
  const context = await requirePermission('pos.view')

  const page = filters?.page || 1
  const limit = filters?.limit || 20
  const skip = (page - 1) * limit

  const branchFilter = context.branchId || filters?.branchId

  const where: any = {
    tenantId: context.tenantId,
    ...(branchFilter && { branchId: branchFilter }),
    ...(filters?.paymentMethod && { paymentMethod: filters.paymentMethod }),
    ...(filters?.startDate && {
      createdAt: {
        gte: filters.startDate,
        ...(filters.endDate && { lte: filters.endDate }),
      },
    }),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
        orderItems: { include: { product: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  return {
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function generateReceipt(orderId: string) {
  const context = await requirePermission('pos.view')

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    include: {
      member: true,
      branch: true,
      orderItems: { include: { product: true } },
    },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  return {
    order,
    receiptNumber: order.orderNumber,
    items: order.orderItems.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.unitPrice,
      discount: item.discount,
      total: item.totalPrice,
    })),
    subtotal: order.totalAmount,
    tax: order.taxAmount,
    grandTotal: order.grandTotal,
  }
}
