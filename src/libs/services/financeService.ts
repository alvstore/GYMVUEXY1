import { prisma } from '@/lib/prisma'
import { Transaction, TransactionType, PaymentMethod, PaymentGateway, TransactionStatus, Invoice, InvoiceStatus } from '@prisma/client'

export interface CreateTransactionData {
  tenantId: string
  branchId: string
  invoiceId?: string
  memberId?: string
  userId?: string
  transactionType: TransactionType
  paymentMethod: PaymentMethod
  paymentGateway?: PaymentGateway
  amount: number
  currency?: string
  reference?: string
  notes?: string
  gatewayOrderId?: string
  gatewayPaymentId?: string
  gatewaySignature?: string
  gatewayResponse?: any
}

export interface CreateExpenseData {
  tenantId: string
  branchId: string
  categoryId: string
  description: string
  amount: number
  expenseDate: Date
  paymentMethod: PaymentMethod
  vendorName?: string
  vendorGstin?: string
  billNumber?: string
  billImageUrl?: string
  taxAmount?: number
  cgstAmount?: number
  sgstAmount?: number
  igstAmount?: number
  notes?: string
  createdBy: string
}

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  membershipRevenue: number
  productRevenue: number
  trainingRevenue: number
  pendingInvoices: number
  overdueInvoices: number
}

export class FinanceService {
  // Transaction Management
  static async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        currency: data.currency || 'INR',
        paymentGateway: data.paymentGateway || 'MANUAL',
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    })

    // Update invoice if provided
    if (data.invoiceId) {
      await this.updateInvoicePayment(data.invoiceId, data.amount)
    }

    return transaction
  }

  static async updateInvoicePayment(invoiceId: string, paidAmount: number) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    const newPaidAmount = Number(invoice.paidAmount) + paidAmount
    const balanceAmount = Number(invoice.totalAmount) - newPaidAmount

    let status: InvoiceStatus = invoice.status
    if (balanceAmount <= 0) {
      status = 'PAID'
    } else if (newPaidAmount > 0) {
      status = 'PARTIALLY_PAID'
    }

    return await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: Math.max(0, balanceAmount),
        status,
      },
    })
  }

  // Expense Management
  static async createExpense(data: CreateExpenseData) {
    return await prisma.expense.create({
      data: {
        ...data,
        taxAmount: data.taxAmount || 0,
        cgstAmount: data.cgstAmount || 0,
        sgstAmount: data.sgstAmount || 0,
        igstAmount: data.igstAmount || 0,
      },
    })
  }

  static async approveExpense(expenseId: string, approvedBy: string) {
    return await prisma.expense.update({
      where: { id: expenseId },
      data: {
        isApproved: true,
        approvedBy,
        approvedAt: new Date(),
      },
    })
  }

  // Financial Reports
  static async getFinancialSummary(
    tenantId: string,
    branchId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<FinancialSummary> {
    const where: any = { tenantId }
    if (branchId) where.branchId = branchId
    if (startDate && endDate) {
      where.createdAt = { gte: startDate, lte: endDate }
    }

    const [
      incomeTransactions,
      expenseTransactions,
      membershipRevenue,
      productRevenue,
      trainingRevenue,
      pendingInvoices,
      overdueInvoices,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          ...where,
          transactionType: { in: ['MEMBERSHIP', 'PRODUCT_SALE', 'TRAINING_SESSION', 'OTHER_INCOME'] },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          ...where,
          transactionType: { in: ['EXPENSE', 'SALARY', 'OTHER_EXPENSE'] },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          ...where,
          transactionType: 'MEMBERSHIP',
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          ...where,
          transactionType: 'PRODUCT_SALE',
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          ...where,
          transactionType: 'TRAINING_SESSION',
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.invoice.count({
        where: {
          ...where,
          status: { in: ['DRAFT', 'SENT'] },
        },
      }),
      prisma.invoice.count({
        where: {
          ...where,
          status: 'OVERDUE',
        },
      }),
    ])

    const totalIncome = Number(incomeTransactions._sum.amount || 0)
    const totalExpenses = Number(expenseTransactions._sum.amount || 0)

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      membershipRevenue: Number(membershipRevenue._sum.amount || 0),
      productRevenue: Number(productRevenue._sum.amount || 0),
      trainingRevenue: Number(trainingRevenue._sum.amount || 0),
      pendingInvoices,
      overdueInvoices,
    }
  }

  // Payment Gateway Integration
  static async createPaymentLink(invoiceId: string, gateway: PaymentGateway = 'RAZORPAY') {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { member: true, branch: true },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    // Mock payment link generation - integrate with actual gateway
    const paymentLink = `https://payments.example.com/pay/${invoice.invoiceNumber}`
    
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paymentLink,
        paymentGateway: gateway,
        status: 'SENT',
      },
    })

    return { paymentLink, invoice }
  }

  // Webhook Processing
  static async processPaymentWebhook(
    gateway: PaymentGateway,
    payload: any,
    signature?: string
  ) {
    // Verify webhook signature (implementation depends on gateway)
    // This is a mock implementation
    
    const { orderId, paymentId, amount, status } = payload
    
    // Find transaction by gateway order ID
    const transaction = await prisma.transaction.findFirst({
      where: { gatewayOrderId: orderId },
      include: { invoice: true },
    })

    if (!transaction) {
      throw new Error('Transaction not found')
    }

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        gatewayPaymentId: paymentId,
        gatewaySignature: signature,
        gatewayResponse: payload,
        status: status === 'success' ? 'COMPLETED' : 'FAILED',
        processedAt: new Date(),
      },
    })

    // Update invoice if payment successful
    if (status === 'success' && transaction.invoice) {
      await this.updateInvoicePayment(transaction.invoiceId!, Number(amount))
    }

    return updatedTransaction
  }

  // GST Calculations
  static calculateGST(amount: number, taxRate: number, isInterState = false) {
    const taxAmount = (amount * taxRate) / 100

    if (isInterState) {
      return {
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: taxAmount,
        totalTax: taxAmount,
      }
    } else {
      return {
        cgstAmount: taxAmount / 2,
        sgstAmount: taxAmount / 2,
        igstAmount: 0,
        totalTax: taxAmount,
      }
    }
  }

  // Dashboard Data
  static async getDashboardData(tenantId: string, branchId?: string) {
    const summary = await this.getFinancialSummary(tenantId, branchId)
    
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        ...(branchId && { branchId }),
      },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            customerName: true,
          },
        },
        member: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const monthlyRevenue = await this.getMonthlyRevenue(tenantId, branchId)

    return {
      summary,
      recentTransactions,
      monthlyRevenue,
    }
  }

  private static async getMonthlyRevenue(tenantId: string, branchId?: string) {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)
    
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        ...(branchId && { branchId }),
        transactionType: { in: ['MEMBERSHIP', 'PRODUCT_SALE', 'TRAINING_SESSION'] },
        status: 'COMPLETED',
        createdAt: { gte: startOfYear },
      },
      select: {
        amount: true,
        createdAt: true,
        transactionType: true,
      },
    })

    // Group by month
    const monthlyData = transactions.reduce((acc, transaction) => {
      const month = transaction.createdAt.toISOString().slice(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { membership: 0, products: 0, training: 0, total: 0 }
      }
      
      const amount = Number(transaction.amount)
      acc[month].total += amount
      
      switch (transaction.transactionType) {
        case 'MEMBERSHIP':
          acc[month].membership += amount
          break
        case 'PRODUCT_SALE':
          acc[month].products += amount
          break
        case 'TRAINING_SESSION':
          acc[month].training += amount
          break
      }
      
      return acc
    }, {} as Record<string, any>)

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    }))
  }
}