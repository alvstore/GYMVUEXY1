'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'
import { reconcileInvoicePayment, reconcileInvoiceRefund } from '@/libs/invoiceReconciliation'
import { PaymentMethod } from '@prisma/client'

export async function getInvoices(filters?: {
  status?: string
  memberId?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}) {
  const context = await requirePermission('invoices.view')

  const page = filters?.page || 1
  const limit = filters?.limit || 20
  const skip = (page - 1) * limit

  const where: any = {
    tenantId: context.tenantId,
    ...(context.branchId && { branchId: context.branchId }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.memberId && { memberId: filters.memberId }),
    ...(filters?.startDate && {
      issueDate: {
        gte: filters.startDate,
        ...(filters.endDate && { lte: filters.endDate }),
      },
    }),
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { issueDate: 'desc' },
      include: {
        member: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: true,
      },
    }),
    prisma.invoice.count({ where }),
  ])

  return {
    invoices,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function createInvoice(data: {
  memberId: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    taxRate?: number
  }>
  dueDate?: Date
  notes?: string
}) {
  const context = await requirePermission('invoices.create')
  const branchId = context.branchId || ''

  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const taxAmount = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice * ((item.taxRate || 18) / 100),
    0
  )
  const total = subtotal + taxAmount

  const invoice = await prisma.invoice.create({
    data: {
      tenantId: context.tenantId,
      branchId,
      memberId: data.memberId,
      invoiceNumber: `INV${Date.now().toString().slice(-8)}`,
      issueDate: new Date(),
      dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal,
      taxAmount,
      totalAmount: total,
      balanceAmount: total,
      status: 'DRAFT',
      notes: data.notes,
      items: {
        create: data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate || 18,
          totalAmount: item.quantity * item.unitPrice * (1 + (item.taxRate || 18) / 100),
        })),
      },
    },
    include: { items: true },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: branchId,
    action: 'Invoice.created',
    resource: 'Invoice',
    resourceId: invoice.id,
    newValues: {
      invoiceNumber: invoice.invoiceNumber,
      memberId: invoice.memberId,
      totalAmount: invoice.totalAmount,
      status: invoice.status
    }
  })

  return invoice
}

export async function finalizeInvoice(id: string) {
  const context = await requirePermission('invoices.update')

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      tenantId: context.tenantId,
      status: 'DRAFT',
    },
  })

  if (!invoice) {
    throw new Error('Invoice not found or already finalized')
  }

  const updated = await prisma.invoice.update({
    where: {
      id,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    data: { status: 'SENT' },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: invoice.branchId,
    action: 'Invoice.finalized',
    resource: 'Invoice',
    resourceId: id,
    newValues: { status: 'SENT' },
  })

  return updated
}

export async function markInvoicePaid(id: string, paymentData: {
  paymentMethod: string
  transactionId?: string
  paidAmount?: number
}) {
  const context = await requirePermission('invoices.payment')

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      tenantId: context.tenantId,
    },
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  const paidAmount = paymentData.paidAmount || invoice.totalAmount
  const paidAt = new Date()

  const updated = await prisma.invoice.update({
    where: {
      id,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    data: {
      status: 'PAID',
      paidAmount,
      paymentMethod: paymentData.paymentMethod as PaymentMethod,
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: invoice.branchId,
    action: 'Invoice.paid',
    resource: 'Invoice',
    resourceId: id,
    newValues: { amount: paidAmount, method: paymentData.paymentMethod },
  })

  return updated
}

export async function refundInvoice(id: string, refundData: {
  refundAmount: number
  reason: string
}) {
  const context = await requirePermission('invoices.refund')

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      tenantId: context.tenantId,
      status: 'PAID',
    },
  })

  if (!invoice) {
    throw new Error('Invoice not found or not paid')
  }

  const updated = await prisma.invoice.update({
    where: {
      id,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    data: {
      status: 'REFUNDED',
      paidAmount: 0,
      balanceAmount: invoice.totalAmount,
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: invoice.branchId,
    action: 'Invoice.refunded',
    resource: 'Invoice',
    resourceId: id,
    newValues: { amount: refundData.refundAmount, reason: refundData.reason },
  })

  return updated
}

// Record partial payment for invoices
export async function recordInvoicePayment(id: string, paymentData: {
  amount: number
  paymentMethod: string
  gatewayOrderId?: string
  gatewayPaymentId?: string
  transactionRef?: string
  notes?: string
}) {
  const context = await requirePermission('invoices.payment')

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  // Use centralized reconciliation for consistency
  const result = await reconcileInvoicePayment({
    invoiceId: id,
    amount: paymentData.amount,
    paymentMethod: paymentData.paymentMethod as PaymentMethod,
    gatewayOrderId: paymentData.gatewayOrderId,
    gatewayPaymentId: paymentData.gatewayPaymentId,
    transactionRef: paymentData.transactionRef,
    notes: paymentData.notes,
    processedBy: context.userId,
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: invoice.branchId,
    action: 'Invoice.payment_received',
    resource: 'Invoice',
    resourceId: id,
    newValues: { 
      amount: paymentData.amount, 
      method: paymentData.paymentMethod,
      paymentId: result.payment.id,
    },
  })

  return result
}

// Process invoice refund with credit note
export async function processInvoiceRefund(id: string, refundData: {
  refundAmount: number
  refundMethod: string
  reason: string
  gatewayRefundId?: string
  notes?: string
}) {
  const context = await requirePermission('invoices.refund')

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  // Use centralized reconciliation for consistency
  const result = await reconcileInvoiceRefund({
    invoiceId: id,
    refundAmount: refundData.refundAmount,
    refundMethod: refundData.refundMethod as PaymentMethod,
    reason: refundData.reason,
    gatewayRefundId: refundData.gatewayRefundId,
    notes: refundData.notes,
    processedBy: context.userId,
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: invoice.branchId,
    action: 'Invoice.refund_processed',
    resource: 'Invoice',
    resourceId: id,
    newValues: { 
      amount: refundData.refundAmount, 
      reason: refundData.reason,
      creditNoteNumber: result.refund.creditNoteNumber,
    },
  })

  return result
}

// Webhook handler for payment gateway callbacks (No auth required for webhooks)
export async function handlePaymentWebhook(data: {
  invoiceId: string
  paymentId: string
  status: string
  amount: number
  paymentMethod: string
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
  })

  if (!invoice) {
    return { success: false, message: 'Invoice not found' }
  }

  if (invoice.status === 'PAID' && data.status === 'PAID') {
    return { success: true, message: 'Already processed (idempotent)' }
  }

  if (data.status === 'PAID') {
    await prisma.invoice.update({
      where: { id: data.invoiceId },
      data: {
        status: 'PAID',
        paidAmount: data.amount,
        balanceAmount: 0,
        paymentMethod: data.paymentMethod as PaymentMethod,
        gatewayPaymentId: data.paymentId,
      },
    })

    await prisma.paymentLog.create({
      data: {
        tenantId: invoice.tenantId,
        branchId: invoice.branchId,
        invoiceId: invoice.id,
        gateway: 'STRIPE',
        gatewayPaymentId: data.paymentId,
        amount: data.amount,
        status: 'COMPLETED',
      },
    })
  }

  return { success: true, message: 'Webhook processed' }
}
