// Commerce Server Actions (Products, Orders, Sales)

'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'

// ============================================================================
// PRODUCTS
// ============================================================================

export async function getProducts(params?: {
  page?: number
  limit?: number
  category?: string
  search?: string
  status?: string
}) {
  const context = await requirePermission('products.view')
  
  const page = params?.page || 1
  const limit = params?.limit || 50
  const skip = (page - 1) * limit

  const where: any = {
    tenantId: context.tenantId,
    ...(context.branchId && { branchId: context.branchId }),
    ...(params?.category && { category: params.category }),
    ...(params?.status && { status: params.status }),
    ...(params?.search && {
      OR: [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
        { barcode: { contains: params.search, mode: 'insensitive' } },
      ],
    }),
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        vendor: { select: { name: true } },
      },
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.product.count({ where }),
  ])

  return {
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getProduct(id: string) {
  const context = await requirePermission('products.view')

  const product = await prisma.product.findFirst({
    where: {
      id,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    include: {
      branch: true,
      vendor: true,
      inventoryMovements: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  return product
}

export async function createProduct(data: {
  branchId: string
  name: string
  description?: string
  category: string
  subcategory?: string
  sku: string
  barcode?: string
  brand?: string
  costPrice: number
  sellingPrice: number
  mrp?: number
  taxRate: number
  stockQuantity?: number
  minStockLevel?: number
  unit?: string
  imageUrl?: string
  images?: string[]
  vendorId?: string
}) {
  const context = await requirePermission('products.create')

  const product = await prisma.product.create({
    data: {
      ...data,
      tenantId: context.tenantId,
      stockQuantity: data.stockQuantity || 0,
      minStockLevel: data.minStockLevel || 0,
      unit: data.unit || 'piece',
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    action: 'CREATE',
    entity: 'Product',
    entityId: product.id,
    metadata: { name: data.name, sku: data.sku },
  })

  return product
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string
    description: string
    category: string
    subcategory: string
    costPrice: number
    sellingPrice: number
    mrp: number
    taxRate: number
    stockQuantity: number
    minStockLevel: number
    imageUrl: string
    images: string[]
    isActive: boolean
  }>
) {
  const context = await requirePermission('products.update')

  const product = await prisma.product.updateMany({
    where: {
      id,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    data,
  })

  if (product.count === 0) {
    throw new Error('Product not found or unauthorized')
  }

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    action: 'UPDATE',
    entity: 'Product',
    entityId: id,
    metadata: data,
  })

  return { success: true }
}

export async function deleteProduct(id: string) {
  const context = await requirePermission('products.delete')

  const product = await prisma.product.deleteMany({
    where: {
      id,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
  })

  if (product.count === 0) {
    throw new Error('Product not found or unauthorized')
  }

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    action: 'DELETE',
    entity: 'Product',
    entityId: id,
    metadata: {},
  })

  return { success: true }
}

// ============================================================================
// ORDERS (Purchase Orders from Vendors)
// ============================================================================

export async function getOrders(params?: {
  page?: number
  limit?: number
  status?: string
  orderType?: string
}) {
  const context = await requirePermission('orders.view')
  
  const page = params?.page || 1
  const limit = params?.limit || 50
  const skip = (page - 1) * limit

  const where: any = {
    tenantId: context.tenantId,
    ...(context.branchId && { branchId: context.branchId }),
    ...(params?.status && { status: params.status }),
    ...(params?.orderType && { orderType: params.orderType }),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        vendor: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
        _count: {
          select: { items: true, payments: true },
        },
      },
      skip,
      take: limit,
      orderBy: { orderDate: 'desc' },
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

export async function createOrder(data: {
  branchId: string
  orderType: string
  vendorId?: string
  expectedDate?: Date
  items: {
    productId: string
    quantity: number
    unitPrice: number
    taxRate: number
    discount: number
  }[]
  notes?: string
}) {
  const context = await requirePermission('orders.create')

  // Generate order number
  const lastOrder = await prisma.order.findFirst({
    where: {
      branchId: data.branchId,
    },
    orderBy: { createdAt: 'desc' },
  })

  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

  // Calculate totals
  let subtotal = 0
  let taxAmount = 0
  const orderItems = data.items.map(item => {
    const itemSubtotal = item.quantity * item.unitPrice - item.discount
    const itemTax = (itemSubtotal * item.taxRate) / 100
    const itemTotal = itemSubtotal + itemTax

    subtotal += itemSubtotal
    taxAmount += itemTax

    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      discount: item.discount,
      totalAmount: itemTotal,
    }
  })

  const totalAmount = subtotal + taxAmount

  const order = await prisma.order.create({
    data: {
      tenantId: context.tenantId,
      branchId: data.branchId,
      orderNumber,
      orderType: data.orderType as any,
      vendorId: data.vendorId,
      expectedDate: data.expectedDate,
      subtotal,
      taxAmount,
      discountAmount: data.items.reduce((sum, item) => sum + item.discount, 0),
      totalAmount,
      notes: data.notes,
      items: {
        create: orderItems,
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    action: 'CREATE',
    entity: 'Order',
    entityId: order.id,
    metadata: { orderNumber, totalAmount },
  })

  return order
}

// ============================================================================
// PRODUCT CATEGORIES
// ============================================================================

export async function getProductCategories() {
  const context = await requirePermission('products.view')

  const categories = await prisma.product.findMany({
    where: {
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    select: {
      category: true,
      subcategory: true,
    },
    distinct: ['category'],
  })

  return categories
}

// ============================================================================
// INVENTORY HELPERS
// ============================================================================

export async function checkInventory(productId: string, quantity: number) {
  const context = await requirePermission('products.view')

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      tenantId: context.tenantId,
    },
    select: {
      id: true,
      name: true,
      stockQuantity: true,
      minStockLevel: true,
    },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  return {
    available: product.stockQuantity >= quantity,
    currentStock: product.stockQuantity,
    requestedQuantity: quantity,
    remainingAfterSale: product.stockQuantity - quantity,
    belowMinStock: product.stockQuantity - quantity < product.minStockLevel,
  }
}
