// Sales Server Actions (POS & Member Store)

'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'
import { reconcileInvoicePayment } from '@/libs/invoiceReconciliation'
import { PaymentMethod } from '@prisma/client'

// ============================================================================
// SALE CREATION (POS & MEMBER STORE)
// ============================================================================

export async function createSale(data: {
  memberId?: string
  channel: 'POS' | 'MEMBER_PORTAL'
  items: {
    productId: string
    quantity: number
  }[]
  paymentMethod?: PaymentMethod
  paymentAmount?: number
  notes?: string
}) {
  const context = await requirePermission('sales.create')
  const branchId = context.branchId || ''

  // POS sales MUST have immediate payment
  if (data.channel === 'POS' && (!data.paymentMethod || !data.paymentAmount)) {
    throw new Error('POS sales require immediate payment')
  }

  // Use database transaction for atomic operations
  return await prisma.$transaction(async (tx) => {
    // 1. Get products and validate inventory
    const productIds = data.items.map(item => item.productId)
    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
        tenantId: context.tenantId,
        isActive: true,
      },
    })

    if (products.length !== productIds.length) {
      throw new Error('Some products not found or inactive')
    }

    // 2. Check inventory availability
    const inventoryChecks = data.items.map(item => {
      const product = products.find(p => p.id === item.productId)
      if (!product) throw new Error('Product not found')
      
      if (product.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`)
      }
      return { product, requestedQty: item.quantity }
    })

    // 3. Calculate totals
    let subtotal = 0
    let taxAmount = 0
    let totalAmount = 0

    const invoiceItems = data.items.map(item => {
      const product = products.find(p => p.id === item.productId)!
      const itemSubtotal = Number(product.sellingPrice) * item.quantity
      const itemTax = (itemSubtotal * Number(product.taxRate)) / 100
      const itemTotal = itemSubtotal + itemTax

      subtotal += itemSubtotal
      taxAmount += itemTax
      totalAmount += itemTotal

      return {
        description: product.name,
        quantity: item.quantity,
        unitPrice: Number(product.sellingPrice),
        taxRate: Number(product.taxRate),
        totalAmount: itemTotal,
        productId: product.id,
      }
    })

    // 4. Create Invoice with proper channel tracking
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    
    const invoice = await tx.invoice.create({
      data: {
        tenantId: context.tenantId,
        branchId,
        memberId: data.memberId,
        invoiceNumber,
        issueDate: new Date(),
        dueDate: new Date(),
        subtotal,
        taxAmount,
        totalAmount,
        balanceAmount: totalAmount,
        salesChannel: data.channel,
        status: 'SENT',
        notes: data.notes,
        invoiceItems: {
          create: invoiceItems,
        },
      },
      include: {
        invoiceItems: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // 5. Update product inventory (within transaction)
    for (const check of inventoryChecks) {
      await tx.product.update({
        where: { id: check.product.id },
        data: {
          stockQuantity: {
            decrement: check.requestedQty,
          },
        },
      })

      // Log inventory movement
      await tx.inventoryMovement.create({
        data: {
          tenantId: context.tenantId,
          branchId,
          productId: check.product.id,
          movementType: 'SALE',
          quantity: -check.requestedQty,
          unitPrice: Number(check.product.sellingPrice),
          totalAmount: Number(check.product.sellingPrice) * check.requestedQty,
          reference: invoiceNumber,
          notes: `Sale - ${data.channel}`,
        },
      })
    }

    // 6. Process payment if provided (POS immediate payment)
    // Note: reconcileInvoicePayment uses its own transaction, so we handle
    // payment reconciliation manually here to keep everything atomic
    if (data.paymentMethod && data.paymentAmount) {
      // Create payment record within this transaction
      const payment = await tx.invoicePayment.create({
        data: {
          invoiceId: invoice.id,
          paymentMethod: data.paymentMethod,
          amount: data.paymentAmount,
          gatewayPaymentId: `${data.channel}-${Date.now()}`,
          transactionRef: `${data.channel}-PAYMENT-${invoiceNumber}`,
          processedBy: context.userId,
          status: 'COMPLETED',
        },
      })

      // Recalculate and update invoice payment status
      const totalPaid = Number(data.paymentAmount)
      const balanceAmount = totalAmount - totalPaid
      const newStatus = balanceAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID'

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: totalPaid,
          balanceAmount,
          status: newStatus,
        },
      })
    }

    // 7. Audit log
    await AuditLogger.log({
      userId: context.userId,
      tenantId: context.tenantId,
      action: 'CREATE',
      entity: 'Sale',
      entityId: invoice.id,
      metadata: {
        channel: data.channel,
        invoiceNumber,
        totalAmount,
        itemCount: data.items.length,
        memberId: data.memberId,
        paymentMethod: data.paymentMethod,
      },
    })

    return {
      invoice,
      success: true,
      message: 'Sale completed successfully',
    }
  })
}

// ============================================================================
// PRODUCT SEARCH FOR POS (Quick Add)
// ============================================================================

export async function searchProductsForSale(query: string) {
  const context = await requirePermission('sales.create')

  const products = await prisma.product.findMany({
    where: {
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 20,
    orderBy: { name: 'asc' },
  })

  return products
}

// ============================================================================
// MEMBER CART (For Member Store)
// ============================================================================

export async function getMemberCart(memberId: string) {
  const context = await requirePermission('sales.view')

  // For now, return empty cart - can implement persistent cart later
  return {
    items: [],
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
  }
}

// ============================================================================
// SALES HISTORY
// ============================================================================

export async function getSales(params?: {
  page?: number
  limit?: number
  channel?: 'POS' | 'MEMBER_PORTAL'
  memberId?: string
  startDate?: Date
  endDate?: Date
}) {
  const context = await requirePermission('sales.view')
  
  const page = params?.page || 1
  const limit = params?.limit || 50
  const skip = (page - 1) * limit

  const where: any = {
    tenantId: context.tenantId,
    ...(context.branchId && { branchId: context.branchId }),
    ...(params?.memberId && { memberId: params.memberId }),
    ...(params?.startDate && {
      invoiceDate: {
        gte: params.startDate,
        ...(params?.endDate && { lte: params.endDate }),
      },
    }),
  }

  const [sales, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        invoiceItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                imageUrl: true,
              },
            },
          },
        },
        payments: true,
      },
      skip,
      take: limit,
      orderBy: { invoiceDate: 'desc' },
    }),
    prisma.invoice.count({ where }),
  ])

  return {
    sales,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}
