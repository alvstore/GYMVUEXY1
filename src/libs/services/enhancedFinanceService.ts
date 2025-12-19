import { prisma } from '@/lib/prisma'
import { Transaction, TransactionType, PaymentMethod, PaymentGateway, PaymentStatus, Invoice, InvoiceStatus, Expense, FinanceCategory, Payroll, PayrollStatus } from '@prisma/client'

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

export interface PaymentGatewayConfigData {
  tenantId: string
  branchId?: string
  gateway: PaymentGateway
  config: any
  isDefault?: boolean
}

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  membershipRevenue: number
  productRevenue: number
  trainingRevenue: number
  lockerRevenue: number
  pendingInvoices: number
  overdueInvoices: number
  monthlyGrowth: number
}

export class EnhancedFinanceService {
  // Payment Gateway Configuration
  static async savePaymentGatewayConfig(data: PaymentGatewayConfigData) {
    // Deactivate other configs if this is set as default
    if (data.isDefault) {
      await prisma.paymentGatewayConfig.updateMany({
        where: { 
          tenantId: data.tenantId, 
          branchId: data.branchId,
          gateway: data.gateway 
        },
        data: { isDefault: false },
      })
    }

    return await prisma.paymentGatewayConfig.upsert({
      where: {
        tenantId_branchId_gateway: {
          tenantId: data.tenantId,
          branchId: data.branchId || '',
          gateway: data.gateway,
        },
      },
      update: {
        config: data.config,
        isActive: true,
        isDefault: data.isDefault || false,
      },
      create: {
        tenantId: data.tenantId,
        branchId: data.branchId,
        gateway: data.gateway,
        config: data.config,
        isActive: true,
        isDefault: data.isDefault || true,
      },
    })
  }

  static async getPaymentGatewayConfig(tenantId: string, branchId?: string, gateway?: PaymentGateway) {
    return await prisma.paymentGatewayConfig.findFirst({
      where: {
        tenantId,
        ...(branchId && { branchId }),
        ...(gateway && { gateway }),
        isActive: true,
      },
      orderBy: [
        { branchId: 'desc' }, // Prefer branch-specific config
        { isDefault: 'desc' },
      ],
    })
  }

  // Enhanced Transaction Management
  static async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          ...data,
          currency: data.currency || 'INR',
          paymentGateway: data.paymentGateway || 'MANUAL',
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      })

      // Create payment log
      await tx.paymentLog.create({
        data: {
          tenantId: data.tenantId,
          branchId: data.branchId,
          transactionId: transaction.id,
          invoiceId: data.invoiceId,
          gateway: data.paymentGateway || 'MANUAL',
          gatewayOrderId: data.gatewayOrderId,
          gatewayPaymentId: data.gatewayPaymentId,
          amount: data.amount,
          currency: data.currency || 'INR',
          status: 'COMPLETED',
          response: data.gatewayResponse,
          processedAt: new Date(),
        },
      })

      // Update invoice if provided
      if (data.invoiceId) {
        await this.updateInvoicePayment(data.invoiceId, data.amount, tx)
      }

      return transaction
    })

    return result
  }

  static async updateInvoicePayment(invoiceId: string, paidAmount: number, tx?: any) {
    const prismaClient = tx || prisma

    const invoice = await prismaClient.invoice.findUnique({
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

    return await prismaClient.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: Math.max(0, balanceAmount),
        status,
        paidAt: status === 'PAID' ? new Date() : invoice.paidAt,
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

  static async getExpenses(tenantId: string, branchId?: string, categoryId?: string, isApproved?: boolean) {
    return await prisma.expense.findMany({
      where: {
        tenantId,
        ...(branchId && { branchId }),
        ...(categoryId && { categoryId }),
        ...(isApproved !== undefined && { isApproved }),
      },
      include: {
        category: true,
        creator: {
          select: {
            name: true,
          },
        },
        approver: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // Finance Categories
  static async createFinanceCategory(tenantId: string, name: string, description?: string, parentId?: string) {
    return await prisma.financeCategory.create({
      data: {
        tenantId,
        name,
        description,
        parentId,
      },
    })
  }

  static async getFinanceCategories(tenantId: string) {
    return await prisma.financeCategory.findMany({
      where: { tenantId, isActive: true },
      include: {
        children: true,
        parent: true,
      },
      orderBy: { name: 'asc' },
    })
  }

  // Enhanced Financial Reports
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
      lockerRevenue,
      pendingInvoices,
      overdueInvoices,
      previousPeriodRevenue,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          ...where,
          transactionType: { in: ['MEMBERSHIP', 'PRODUCT_SALE', 'TRAINING_SESSION', 'LOCKER_RENTAL', 'OTHER_INCOME'] },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          tenantId,
          ...(branchId && { branchId }),
          isApproved: true,
          ...(startDate && endDate && {
            expenseDate: { gte: startDate, lte: endDate }
          }),
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, transactionType: 'MEMBERSHIP', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, transactionType: 'PRODUCT_SALE', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, transactionType: 'TRAINING_SESSION', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, transactionType: 'LOCKER_RENTAL', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.invoice.count({
        where: {
          tenantId,
          ...(branchId && { branchId }),
          status: { in: ['DRAFT', 'SENT'] },
        },
      }),
      prisma.invoice.count({
        where: {
          tenantId,
          ...(branchId && { branchId }),
          status: 'OVERDUE',
        },
      }),
      this.getPreviousPeriodRevenue(tenantId, branchId, startDate, endDate),
    ])

    const totalIncome = Number(incomeTransactions._sum.amount || 0)
    const totalExpenses = Number(expenseTransactions._sum.amount || 0)
    const previousRevenue = Number(previousPeriodRevenue || 0)

    const monthlyGrowth = previousRevenue > 0 
      ? ((totalIncome - previousRevenue) / previousRevenue) * 100 
      : 0

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      membershipRevenue: Number(membershipRevenue._sum.amount || 0),
      productRevenue: Number(productRevenue._sum.amount || 0),
      trainingRevenue: Number(trainingRevenue._sum.amount || 0),
      lockerRevenue: Number(lockerRevenue._sum.amount || 0),
      pendingInvoices,
      overdueInvoices,
      monthlyGrowth,
    }
  }

  // Payment Gateway Integration
  static async createPaymentOrder(invoiceId: string, gateway: PaymentGateway = 'RAZORPAY') {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { member: true, branch: true, tenant: true },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    const gatewayConfig = await this.getPaymentGatewayConfig(
      invoice.tenantId, 
      invoice.branchId, 
      gateway
    )

    if (!gatewayConfig) {
      throw new Error(`Payment gateway ${gateway} not configured`)
    }

    // Create payment order based on gateway
    const orderData = await this.createGatewayOrder(gatewayConfig, invoice)
    
    // Update invoice with payment details
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paymentGateway: gateway,
        gatewayOrderId: orderData.orderId,
        paymentLink: orderData.paymentLink,
        status: 'SENT',
      },
    })

    return { orderData, invoice }
  }

  // Webhook Processing
  static async processPaymentWebhook(
    gateway: PaymentGateway,
    payload: any,
    signature?: string
  ) {
    // Verify webhook signature
    const isValid = await this.verifyWebhookSignature(gateway, payload, signature)
    
    if (!isValid) {
      throw new Error('Invalid webhook signature')
    }

    const { orderId, paymentId, amount, status } = payload
    
    // Find invoice by gateway order ID
    const invoice = await prisma.invoice.findFirst({
      where: { gatewayOrderId: orderId },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    // Log payment attempt
    await prisma.paymentLog.create({
      data: {
        tenantId: invoice.tenantId,
        branchId: invoice.branchId,
        invoiceId: invoice.id,
        gateway,
        gatewayOrderId: orderId,
        gatewayPaymentId: paymentId,
        amount: Number(amount) / 100, // Convert from paise
        status: status === 'success' ? 'COMPLETED' : 'FAILED',
        webhookData: payload,
        processedAt: new Date(),
      },
    })

    // Process payment if successful
    if (status === 'success' || status === 'captured') {
      await this.createTransaction({
        tenantId: invoice.tenantId,
        branchId: invoice.branchId,
        invoiceId: invoice.id,
        memberId: invoice.memberId || undefined,
        transactionType: 'MEMBERSHIP', // Determine based on invoice type
        paymentMethod: 'ONLINE',
        paymentGateway: gateway,
        amount: Number(amount) / 100,
        gatewayOrderId: orderId,
        gatewayPaymentId: paymentId,
        gatewaySignature: signature,
        gatewayResponse: payload,
      })
    }

    return { success: status === 'success', invoice }
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

  // Multi-Currency Support
  static async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    // Mock implementation - integrate with actual currency API
    const exchangeRates: Record<string, number> = {
      'USD': 83.12,
      'EUR': 90.45,
      'GBP': 105.23,
      'AED': 22.63,
      'SGD': 61.78,
    }

    if (fromCurrency === 'INR' && toCurrency !== 'INR') {
      return amount / (exchangeRates[toCurrency] || 1)
    } else if (fromCurrency !== 'INR' && toCurrency === 'INR') {
      return amount * (exchangeRates[fromCurrency] || 1)
    }

    return amount // Same currency
  }

  // Recurring Invoice Generation
  static async generateRecurringInvoices() {
    // Get all active locker assignments that need billing
    const lockerAssignments = await prisma.lockerAssignment.findMany({
      where: {
        status: 'ACTIVE',
        // Add logic to check if invoice is due
      },
      include: {
        member: true,
        locker: true,
      },
    })

    const invoices = []

    for (const assignment of lockerAssignments) {
      // Check if invoice already exists for current month
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          lockerAssignmentId: assignment.id,
          invoiceNumber: { contains: currentMonth },
        },
      })

      if (!existingInvoice) {
        const invoiceCount = await prisma.invoice.count({
          where: { branchId: assignment.branchId }
        })
        const invoiceNumber = `INV-${assignment.branchId.slice(-4).toUpperCase()}-${String(invoiceCount + 1).padStart(4, '0')}`

        const invoice = await prisma.invoice.create({
          data: {
            tenantId: assignment.tenantId,
            branchId: assignment.branchId,
            invoiceNumber,
            memberId: assignment.memberId,
            lockerAssignmentId: assignment.id,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            subtotal: assignment.monthlyRate,
            totalAmount: assignment.monthlyRate,
            status: 'DRAFT',
            notes: `Locker rental: ${assignment.locker.lockerNumber} - ${currentMonth}`,
          },
        })

        invoices.push(invoice)
      }
    }

    return invoices
  }

  // Private helper methods
  private static async createGatewayOrder(gatewayConfig: any, invoice: any) {
    switch (gatewayConfig.gateway) {
      case 'RAZORPAY':
        return this.createRazorpayOrder(gatewayConfig.config, invoice)
      case 'PAYU':
        return this.createPayUOrder(gatewayConfig.config, invoice)
      case 'PHONEPE':
        return this.createPhonePeOrder(gatewayConfig.config, invoice)
      default:
        throw new Error(`Unsupported gateway: ${gatewayConfig.gateway}`)
    }
  }

  private static async createRazorpayOrder(config: any, invoice: any) {
    // Mock Razorpay order creation
    return {
      orderId: `order_${Date.now()}`,
      paymentLink: `https://rzp.io/l/${invoice.invoiceNumber}`,
      amount: Number(invoice.totalAmount) * 100, // Convert to paise
    }
  }

  private static async createPayUOrder(config: any, invoice: any) {
    // Mock PayU order creation
    return {
      orderId: `payu_${Date.now()}`,
      paymentLink: `https://secure.payu.in/_payment?key=${config.merchantKey}&txnid=${invoice.invoiceNumber}`,
      amount: Number(invoice.totalAmount),
    }
  }

  private static async createPhonePeOrder(config: any, invoice: any) {
    // Mock PhonePe order creation
    return {
      orderId: `phonepe_${Date.now()}`,
      paymentLink: `https://mercury.phonepe.com/transact?merchantId=${config.merchantId}&transactionId=${invoice.invoiceNumber}`,
      amount: Number(invoice.totalAmount),
    }
  }

  private static async verifyWebhookSignature(gateway: PaymentGateway, payload: any, signature?: string): Promise<boolean> {
    // Mock signature verification - implement actual verification for each gateway
    switch (gateway) {
      case 'RAZORPAY':
        // Implement Razorpay signature verification
        return true
      case 'PAYU':
        // Implement PayU signature verification
        return true
      case 'PHONEPE':
        // Implement PhonePe signature verification
        return true
      default:
        return false
    }
  }

  private static async getPreviousPeriodRevenue(tenantId: string, branchId?: string, startDate?: Date, endDate?: Date): Promise<number> {
    if (!startDate || !endDate) return 0

    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const previousStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000)
    const previousEndDate = new Date(startDate.getTime() - 1)

    const previousRevenue = await prisma.transaction.aggregate({
      where: {
        tenantId,
        ...(branchId && { branchId }),
        transactionType: { in: ['MEMBERSHIP', 'PRODUCT_SALE', 'TRAINING_SESSION', 'LOCKER_RENTAL'] },
        status: 'COMPLETED',
        createdAt: { gte: previousStartDate, lte: previousEndDate },
      },
      _sum: { amount: true },
    })

    return Number(previousRevenue._sum.amount || 0)
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
    const expensesByCategory = await this.getExpensesByCategory(tenantId, branchId)

    return {
      summary,
      recentTransactions,
      monthlyRevenue,
      expensesByCategory,
    }
  }

  private static async getMonthlyRevenue(tenantId: string, branchId?: string) {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)
    
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        ...(branchId && { branchId }),
        transactionType: { in: ['MEMBERSHIP', 'PRODUCT_SALE', 'TRAINING_SESSION', 'LOCKER_RENTAL'] },
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
        acc[month] = { membership: 0, products: 0, training: 0, lockers: 0, total: 0 }
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
        case 'LOCKER_RENTAL':
          acc[month].lockers += amount
          break
      }
      
      return acc
    }, {} as Record<string, any>)

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    }))
  }

  private static async getExpensesByCategory(tenantId: string, branchId?: string) {
    return await prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        tenantId,
        ...(branchId && { branchId }),
        isApproved: true,
      },
      _sum: { amount: true },
      _count: { id: true },
    })
  }
}