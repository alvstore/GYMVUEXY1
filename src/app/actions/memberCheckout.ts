// Member-facing checkout actions (no RBAC required for authenticated members)

'use server'

import { prisma } from '@/libs/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { AuditLogger } from '@/libs/auditLogger'

// ============================================================================
// MEMBER CHECKOUT (No RBAC - authenticated members only)
// ============================================================================

export async function createMemberOrder(data: {
  items: {
    productId: string
    quantity: number
  }[]
  notes?: string
}) {
  // Get authenticated session
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    throw new Error('Authentication required')
  }

  // Find member by email (members don't have userId, they have email)
  const member = await prisma.member.findFirst({
    where: { 
      email: session.user.email,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      tenantId: true,
      branchId: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  })

  if (!member) {
    throw new Error('Member profile not found. Please contact gym administration.')
  }

  // Use database transaction for atomic operations
  return await prisma.$transaction(async (tx) => {
    // 1. Get products and validate inventory
    const productIds = data.items.map(item => item.productId)
    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
        tenantId: member.tenantId,
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

    // 4. Create Invoice
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    
    const invoice = await tx.invoice.create({
      data: {
        tenantId: member.tenantId,
        branchId: member.branchId,
        memberId: member.id,
        invoiceNumber,
        issueDate: new Date(),
        dueDate: new Date(),
        subtotal,
        taxAmount,
        totalAmount,
        balanceAmount: totalAmount,
        salesChannel: 'MEMBER_PORTAL',
        status: 'SENT',
        notes: data.notes,
        items: {
          create: invoiceItems,
        },
      },
    })

    // 5. Update product inventory
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
          tenantId: member.tenantId,
          branchId: member.branchId,
          productId: check.product.id,
          movementType: 'SALE',
          quantity: -check.requestedQty,
          unitPrice: Number(check.product.sellingPrice),
          totalAmount: Number(check.product.sellingPrice) * check.requestedQty,
          reference: invoiceNumber,
          notes: 'Member Store Purchase',
        },
      })
    }

    // 6. Audit log (use member email as userId since members don't have User accounts)
    await AuditLogger.log({
      userId: member.email || 'member-checkout',
      tenantId: member.tenantId,
      action: 'CREATE',
      entity: 'MemberOrder',
      entityId: invoice.id,
      metadata: {
        channel: 'MEMBER_PORTAL',
        invoiceNumber,
        totalAmount,
        itemCount: data.items.length,
        memberId: member.id,
        memberEmail: member.email,
      },
    })

    // Return invoice with member details
    const invoiceWithMember = await tx.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
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

    return {
      invoice: invoiceWithMember,
      success: true,
      message: 'Order created successfully',
    }
  })
}

// ============================================================================
// PUBLIC PRODUCTS (No auth required for browsing)
// ============================================================================

export async function getPublicProducts(params?: {
  page?: number
  limit?: number
  category?: string
  search?: string
}) {
  const page = params?.page || 1
  const limit = params?.limit || 50
  const skip = (page - 1) * limit

  const where: any = {
    isActive: true,
    stockQuantity: { gt: 0 },
    ...(params?.category && params.category !== 'ALL' && {
      category: params.category,
    }),
    ...(params?.search && {
      OR: [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ],
    }),
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        subcategory: true,
        sellingPrice: true,
        mrp: true,
        taxRate: true,
        stockQuantity: true,
        imageUrl: true,
        images: true,
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
