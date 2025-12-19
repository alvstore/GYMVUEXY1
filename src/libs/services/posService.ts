import { prisma } from '@/lib/prisma'
import { ProductService } from './productService'
import { PaymentMethod, TransactionType } from '@prisma/client'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  taxRate: number
  discount: number
  total: number
}

export interface CheckoutData {
  branchId: string
  items: CartItem[]
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  paymentMethod: PaymentMethod
  discountAmount?: number
  notes?: string
}

export interface POSTransaction {
  invoiceId: string
  invoiceNumber: string
  totalAmount: number
  paymentMethod: PaymentMethod
  status: string
}

export class POSService {
  static async checkout(data: CheckoutData): Promise<POSTransaction> {
    const { branchId, items, customerName, customerEmail, customerPhone, paymentMethod, discountAmount = 0, notes } = data

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const taxAmount = items.reduce((sum, item) => sum + (item.price * item.quantity * item.taxRate / 100), 0)
    const totalAmount = subtotal + taxAmount - discountAmount

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { branchId }
    })
    const invoiceNumber = `INV-${branchId.slice(-4).toUpperCase()}-${String(invoiceCount + 1).padStart(4, '0')}`

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create invoice
        const invoice = await tx.invoice.create({
          data: {
            branchId,
            invoiceNumber,
            customerName,
            customerEmail,
            customerPhone,
            subtotal,
            taxAmount,
            discountAmount,
            totalAmount,
            status: 'PAID',
            notes,
          },
        })

        // Create invoice items and update stock
        for (const item of items) {
          await tx.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.price,
              taxRate: item.taxRate,
              discount: item.discount,
              totalAmount: item.total,
            },
          })

          // Update product stock
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          })

          if (!product) {
            throw new Error(`Product ${item.productId} not found`)
          }

          if (product.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`)
          }

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: product.stockQuantity - item.quantity,
            },
          })

          // Create inventory movement
          await tx.inventoryMovement.create({
            data: {
              branchId,
              productId: item.productId,
              movementType: 'SALE',
              quantity: -item.quantity,
              unitPrice: item.price,
              totalAmount: -item.total,
              reference: invoice.id,
              notes: `POS Sale - Invoice ${invoiceNumber}`,
            },
          })
        }

        // Create transaction
        const transaction = await tx.transaction.create({
          data: {
            branchId,
            invoiceId: invoice.id,
            transactionType: 'PRODUCT_SALE',
            paymentMethod,
            amount: totalAmount,
            status: 'COMPLETED',
            notes: `POS Payment - ${paymentMethod}`,
          },
        })

        return {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount,
          paymentMethod: transaction.paymentMethod,
          status: transaction.status,
        }
      })

      return result
    } catch (error) {
      console.error('Checkout error:', error)
      throw new Error(`Checkout failed: ${error.message}`)
    }
  }

  static async getInvoice(invoiceId: string) {
    return await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        transactions: true,
        branch: true,
      },
    })
  }

  static async getRecentTransactions(branchId: string, limit = 10) {
    return await prisma.transaction.findMany({
      where: { branchId },
      include: {
        invoice: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  static async getDailySales(branchId: string, date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const transactions = await prisma.transaction.findMany({
      where: {
        branchId,
        transactionType: 'PRODUCT_SALE',
        status: 'COMPLETED',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        invoice: true,
      },
    })

    const totalSales = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const totalTransactions = transactions.length

    const paymentMethodBreakdown = transactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + Number(t.amount)
      return acc
    }, {} as Record<string, number>)

    return {
      totalSales,
      totalTransactions,
      paymentMethodBreakdown,
      transactions,
    }
  }

  static async refundTransaction(transactionId: string, reason?: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        invoice: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    })

    if (!transaction) {
      throw new Error('Transaction not found')
    }

    if (transaction.status !== 'COMPLETED') {
      throw new Error('Only completed transactions can be refunded')
    }

    await prisma.$transaction(async (tx) => {
      // Update original transaction
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: 'REFUNDED' },
      })

      // Create refund transaction
      await tx.transaction.create({
        data: {
          branchId: transaction.branchId,
          invoiceId: transaction.invoiceId,
          transactionType: 'REFUND',
          paymentMethod: transaction.paymentMethod,
          amount: -transaction.amount,
          status: 'COMPLETED',
          notes: `Refund for transaction ${transactionId}. Reason: ${reason || 'No reason provided'}`,
        },
      })

      // Restore stock for each item
      if (transaction.invoice) {
        for (const item of transaction.invoice.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          })

          // Create inventory movement for stock restoration
          await tx.inventoryMovement.create({
            data: {
              branchId: transaction.branchId,
              productId: item.productId,
              movementType: 'RETURN',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalAmount: item.totalAmount,
              reference: transaction.invoiceId,
              notes: `Stock restored - Refund for Invoice ${transaction.invoice.invoiceNumber}`,
            },
          })
        }

        // Update invoice status
        await tx.invoice.update({
          where: { id: transaction.invoiceId! },
          data: { status: 'REFUNDED' },
        })
      }
    })
  }
}