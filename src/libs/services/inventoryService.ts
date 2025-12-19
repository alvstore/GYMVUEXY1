import { prisma } from '@/lib/prisma'
import { Product, ProductStatus, InventoryMovementType, Order, OrderStatus, OrderType } from '@prisma/client'

export interface CreateProductData {
  branchId: string
  name: string
  description?: string
  category: string
  subcategory?: string
  sku: string
  barcode?: string
  brand?: string
  costPrice?: number
  sellingPrice: number
  mrp?: number
  taxRate?: number
  stockQuantity?: number
  minStockLevel?: number
  maxStockLevel?: number
  reorderPoint?: number
  unit?: string
  weight?: number
  dimensions?: any
  imageUrl?: string
  images?: string[]
  vendorId?: string
  vendorName?: string
  vendorSku?: string
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string
  status?: ProductStatus
}

export interface ProductFilters {
  branchId?: string
  category?: string
  subcategory?: string
  status?: ProductStatus
  search?: string
  lowStock?: boolean
  outOfStock?: boolean
  vendorId?: string
}

export interface CreateOrderData {
  branchId: string
  orderType: OrderType
  vendorId?: string
  orderDate?: Date
  expectedDate?: Date
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
    taxRate?: number
    discount?: number
  }>
  notes?: string
}

export class InventoryService {
  // Product Management
  static async createProduct(data: CreateProductData, tenantId: string): Promise<Product> {
    return await prisma.product.create({
      data: {
        ...data,
        tenantId,
        costPrice: data.costPrice || 0,
        taxRate: data.taxRate || 0,
        stockQuantity: data.stockQuantity || 0,
        minStockLevel: data.minStockLevel || 0,
        unit: data.unit || 'piece',
        images: data.images || [],
        status: 'ACTIVE',
      },
    })
  }

  static async updateProduct(data: UpdateProductData): Promise<Product> {
    const { id, ...updateData } = data
    return await prisma.product.update({
      where: { id },
      data: updateData,
    })
  }

  static async deleteProduct(id: string): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { status: 'DISCONTINUED', isActive: false },
    })
  }

  static async getProduct(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        branch: true,
        vendor: true,
        inventoryMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        orderItems: {
          include: {
            order: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })
  }

  static async getProducts(filters: ProductFilters = {}, page = 1, limit = 20) {
    const where: any = {}

    if (filters.branchId) {
      where.branchId = filters.branchId
    }

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.subcategory) {
      where.subcategory = filters.subcategory
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { barcode: { contains: filters.search, mode: 'insensitive' } },
        { brand: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.lowStock) {
      where.stockQuantity = { lte: prisma.product.fields.minStockLevel }
    }

    if (filters.outOfStock) {
      where.stockQuantity = 0
    }

    if (filters.vendorId) {
      where.vendorId = filters.vendorId
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          branch: true,
          vendor: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return {
      products,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  // Stock Management
  static async updateStock(
    productId: string,
    quantity: number,
    movementType: InventoryMovementType,
    unitPrice?: number,
    reference?: string,
    notes?: string
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      throw new Error('Product not found')
    }

    let newQuantity = product.stockQuantity
    let adjustmentQuantity = quantity

    switch (movementType) {
      case 'PURCHASE':
      case 'RETURN':
      case 'ADJUSTMENT':
        newQuantity += quantity
        break
      case 'SALE':
      case 'DAMAGE':
      case 'EXPIRED':
        newQuantity -= quantity
        adjustmentQuantity = -quantity
        if (newQuantity < 0) {
          throw new Error('Insufficient stock')
        }
        break
      case 'TRANSFER':
        // Handle transfer logic separately
        break
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { 
          stockQuantity: newQuantity,
          status: newQuantity === 0 ? 'OUT_OF_STOCK' : product.status,
        },
      })

      // Create inventory movement record
      const movement = await tx.inventoryMovement.create({
        data: {
          tenantId: product.tenantId,
          branchId: product.branchId,
          productId,
          movementType,
          quantity: adjustmentQuantity,
          unitPrice: unitPrice || product.sellingPrice,
          totalAmount: (unitPrice || product.sellingPrice) * Math.abs(adjustmentQuantity),
          reference,
          notes,
        },
      })

      return { product: updatedProduct, movement }
    })

    return result
  }

  // Order Management
  static async createOrder(data: CreateOrderData, tenantId: string) {
    // Generate order number
    const orderCount = await prisma.order.count({
      where: { branchId: data.branchId }
    })
    const orderNumber = `ORD-${data.branchId.slice(-4).toUpperCase()}-${String(orderCount + 1).padStart(4, '0')}`

    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const taxAmount = data.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice
      return sum + (itemTotal * (item.taxRate || 0) / 100)
    }, 0)
    const discountAmount = data.items.reduce((sum, item) => sum + (item.discount || 0), 0)
    const totalAmount = subtotal + taxAmount - discountAmount

    const result = await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          tenantId,
          branchId: data.branchId,
          orderNumber,
          orderType: data.orderType,
          vendorId: data.vendorId,
          orderDate: data.orderDate || new Date(),
          expectedDate: data.expectedDate,
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          status: 'PENDING',
          notes: data.notes,
        },
      })

      // Create order items
      for (const item of data.items) {
        const itemTotal = (item.quantity * item.unitPrice) + 
                         (item.quantity * item.unitPrice * (item.taxRate || 0) / 100) - 
                         (item.discount || 0)

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 0,
            discount: item.discount || 0,
            totalAmount: itemTotal,
          },
        })
      }

      return order
    })

    return result
  }

  static async receiveOrder(orderId: string, receivedItems?: Array<{ productId: string; receivedQuantity: number }>) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      throw new Error('Order not found')
    }

    if (order.status !== 'CONFIRMED') {
      throw new Error('Order must be confirmed before receiving')
    }

    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'RECEIVED',
          receivedDate: new Date(),
        },
      })

      // Update stock for each item
      for (const item of order.items) {
        const receivedQty = receivedItems?.find(ri => ri.productId === item.productId)?.receivedQuantity || item.quantity

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: receivedQty },
            status: 'ACTIVE', // Reactivate if was out of stock
          },
        })

        // Create inventory movement
        await tx.inventoryMovement.create({
          data: {
            tenantId: order.tenantId,
            branchId: order.branchId,
            productId: item.productId,
            movementType: 'PURCHASE',
            quantity: receivedQty,
            unitPrice: item.unitPrice,
            totalAmount: item.unitPrice * receivedQty,
            reference: order.id,
            notes: `Stock received - Order ${order.orderNumber}`,
          },
        })
      }
    })
  }

  // Analytics
  static async getInventoryStats(branchId?: string) {
    const where = branchId ? { branchId } : {}

    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalInventoryValue,
      pendingOrders,
    ] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.product.count({
        where: {
          ...where,
          stockQuantity: { lte: prisma.product.fields.minStockLevel },
          status: 'ACTIVE',
        },
      }),
      prisma.product.count({ where: { ...where, stockQuantity: 0 } }),
      prisma.product.aggregate({
        where: { ...where, status: 'ACTIVE' },
        _sum: {
          stockQuantity: true,
        },
      }),
      prisma.order.count({
        where: {
          ...where,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }),
    ])

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalInventoryValue: Number(totalInventoryValue._sum.stockQuantity || 0),
      pendingOrders,
    }
  }

  static async getLowStockProducts(branchId?: string, limit = 20) {
    const where: any = {
      status: 'ACTIVE',
      stockQuantity: { lte: prisma.product.fields.minStockLevel },
    }

    if (branchId) {
      where.branchId = branchId
    }

    return await prisma.product.findMany({
      where,
      include: {
        vendor: {
          select: {
            name: true,
            contactPerson: true,
            phone: true,
          },
        },
      },
      orderBy: { stockQuantity: 'asc' },
      take: limit,
    })
  }

  static async getTopSellingProducts(branchId?: string, days = 30, limit = 10) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const where: any = {
      createdAt: { gte: startDate },
      movementType: 'SALE',
    }

    if (branchId) {
      where.branchId = branchId
    }

    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        product: true,
      },
    })

    // Group by product and sum quantities
    const productSales = movements.reduce((acc, movement) => {
      const productId = movement.productId
      if (!acc[productId]) {
        acc[productId] = {
          product: movement.product,
          totalQuantity: 0,
          totalRevenue: 0,
        }
      }
      acc[productId].totalQuantity += Math.abs(movement.quantity)
      acc[productId].totalRevenue += Number(movement.totalAmount)
      return acc
    }, {} as Record<string, any>)

    return Object.values(productSales)
      .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit)
  }

  // Reorder Suggestions
  static async generateReorderSuggestions(branchId: string) {
    const lowStockProducts = await this.getLowStockProducts(branchId)
    
    const suggestions = await Promise.all(
      lowStockProducts.map(async (product) => {
        // Calculate average consumption over last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const consumption = await prisma.inventoryMovement.aggregate({
          where: {
            productId: product.id,
            movementType: 'SALE',
            createdAt: { gte: thirtyDaysAgo },
          },
          _sum: { quantity: true },
        })

        const avgDailyConsumption = Math.abs(Number(consumption._sum.quantity || 0)) / 30
        const suggestedQuantity = Math.max(
          product.minStockLevel * 2, // At least 2x min stock
          Math.ceil(avgDailyConsumption * 60) // 60 days supply
        )

        return {
          product,
          currentStock: product.stockQuantity,
          minStockLevel: product.minStockLevel,
          avgDailyConsumption,
          suggestedQuantity,
          estimatedCost: Number(product.costPrice) * suggestedQuantity,
        }
      })
    )

    return suggestions.filter(s => s.suggestedQuantity > 0)
  }

  // Categories
  static async getCategories(branchId?: string): Promise<string[]> {
    const products = await prisma.product.findMany({
      where: branchId ? { branchId } : {},
      select: { category: true },
      distinct: ['category'],
    })

    return products.map(p => p.category)
  }

  static async getSubcategories(category: string, branchId?: string): Promise<string[]> {
    const products = await prisma.product.findMany({
      where: {
        category,
        ...(branchId && { branchId }),
      },
      select: { subcategory: true },
      distinct: ['subcategory'],
    })

    return products.map(p => p.subcategory).filter(Boolean) as string[]
  }

  // Vendor Management
  static async createVendor(data: {
    tenantId: string
    name: string
    contactPerson?: string
    email?: string
    phone?: string
    address?: string
    gstin?: string
    panNumber?: string
    bankDetails?: any
  }) {
    return await prisma.vendor.create({
      data,
    })
  }

  static async getVendors(tenantId: string) {
    return await prisma.vendor.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  // Inventory Movements
  static async getInventoryMovements(
    filters: {
      branchId?: string
      productId?: string
      movementType?: InventoryMovementType
      startDate?: Date
      endDate?: Date
    } = {},
    page = 1,
    limit = 50
  ) {
    const where: any = {}

    if (filters.branchId) where.branchId = filters.branchId
    if (filters.productId) where.productId = filters.productId
    if (filters.movementType) where.movementType = filters.movementType

    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: filters.startDate,
        lte: filters.endDate,
      }
    }

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              unit: true,
            },
          },
          branch: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inventoryMovement.count({ where }),
    ])

    return {
      movements,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  // Stock Alerts
  static async checkStockAlerts(branchId: string) {
    const lowStockProducts = await this.getLowStockProducts(branchId)
    const outOfStockProducts = await prisma.product.findMany({
      where: {
        branchId,
        stockQuantity: 0,
        status: 'ACTIVE',
      },
    })

    return {
      lowStock: lowStockProducts,
      outOfStock: outOfStockProducts,
      totalAlerts: lowStockProducts.length + outOfStockProducts.length,
    }
  }

  // Barcode Generation
  static generateSKU(category: string, branchId: string): string {
    const categoryCode = category.substring(0, 3).toUpperCase()
    const branchCode = branchId.slice(-2).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    return `${categoryCode}-${branchCode}-${timestamp}`
  }

  // Bulk Operations
  static async bulkUpdatePrices(productIds: string[], priceIncrease: number, isPercentage = true) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    })

    const updates = products.map(product => {
      const newPrice = isPercentage 
        ? Number(product.sellingPrice) * (1 + priceIncrease / 100)
        : Number(product.sellingPrice) + priceIncrease

      return prisma.product.update({
        where: { id: product.id },
        data: { sellingPrice: newPrice },
      })
    })

    return await prisma.$transaction(updates)
  }

  static async bulkStockAdjustment(adjustments: Array<{ productId: string; quantity: number; reason?: string }>) {
    const movements = adjustments.map(adj => 
      this.updateStock(
        adj.productId,
        adj.quantity,
        'ADJUSTMENT',
        undefined,
        'bulk_adjustment',
        adj.reason || 'Bulk stock adjustment'
      )
    )

    return await Promise.all(movements)
  }
}