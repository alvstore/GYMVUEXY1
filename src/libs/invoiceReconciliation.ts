// Centralized invoice payment and refund reconciliation logic
// Used by both authenticated server actions and public webhook handlers

import { prisma } from '@/libs/prisma'
import { PaymentMethod } from '@prisma/client'

/**
 * Record a payment for an invoice and update totals/status
 * This is the single source of truth for invoice payment reconciliation
 */
export async function reconcileInvoicePayment(params: {
  invoiceId: string
  amount: number
  paymentMethod: PaymentMethod
  gatewayOrderId?: string
  gatewayPaymentId?: string
  transactionRef?: string
  notes?: string
  processedBy: string
}) {
  return await prisma.$transaction(async (tx) => {
    // Verify invoice exists
    const invoice = await tx.invoice.findUnique({
      where: { id: params.invoiceId },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    if (invoice.status === 'REFUNDED' || invoice.status === 'CANCELLED') {
      throw new Error('Cannot record payment for refunded or cancelled invoice')
    }

    // Create payment record
    const payment = await tx.invoicePayment.create({
      data: {
        invoiceId: params.invoiceId,
        paymentMethod: params.paymentMethod,
        amount: params.amount,
        gatewayOrderId: params.gatewayOrderId,
        gatewayPaymentId: params.gatewayPaymentId,
        transactionRef: params.transactionRef,
        notes: params.notes,
        processedBy: params.processedBy,
        status: 'COMPLETED',
      },
    })

    // Recalculate total paid from all completed payments
    const allPayments = await tx.invoicePayment.findMany({
      where: { invoiceId: params.invoiceId, status: 'COMPLETED' },
    })
    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const balanceAmount = Number(invoice.totalAmount) - totalPaid

    // Update invoice with new totals and status
    const newStatus = 
      balanceAmount <= 0 ? 'PAID' : 
      totalPaid > 0 ? 'PARTIALLY_PAID' : 
      invoice.status

    const updatedInvoice = await tx.invoice.update({
      where: { id: params.invoiceId },
      data: {
        paidAmount: totalPaid,
        balanceAmount,
        status: newStatus,
      },
    })

    return { payment, invoice: updatedInvoice }
  })
}

/**
 * Process a refund for an invoice and update totals/status
 * This is the single source of truth for invoice refund reconciliation
 */
export async function reconcileInvoiceRefund(params: {
  invoiceId: string
  refundAmount: number
  refundMethod: PaymentMethod
  reason: string
  gatewayRefundId?: string
  notes?: string
  processedBy: string
}) {
  return await prisma.$transaction(async (tx) => {
    // Verify invoice exists and get all payments/refunds
    const invoice = await tx.invoice.findUnique({
      where: { id: params.invoiceId },
      include: {
        payments: { where: { status: 'COMPLETED' } },
        refunds: { where: { status: 'COMPLETED' } },
      },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    // Calculate gross paid (total of all completed payments)
    const grossPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    
    // Calculate current total refunded
    const currentRefunded = invoice.refunds.reduce((sum, r) => sum + Number(r.refundAmount), 0)

    // Validate refund doesn't exceed gross paid amount
    if (currentRefunded + params.refundAmount > grossPaid) {
      throw new Error('Refund amount exceeds total paid amount')
    }

    // Generate credit note number
    const creditNoteNumber = `CN${Date.now().toString().slice(-8)}`

    // Create refund record
    const refund = await tx.invoiceRefund.create({
      data: {
        invoiceId: params.invoiceId,
        refundAmount: params.refundAmount,
        refundMethod: params.refundMethod,
        reason: params.reason,
        creditNoteNumber,
        gatewayRefundId: params.gatewayRefundId,
        notes: params.notes,
        processedBy: params.processedBy,
        status: 'COMPLETED',
      },
    })

    // Recalculate total refunded from all completed refunds (including the new one)
    const totalRefunded = currentRefunded + params.refundAmount

    // Net paid amount after refunds
    const netPaidAmount = grossPaid - totalRefunded
    const balanceAmount = Number(invoice.totalAmount) - netPaidAmount

    // Determine new status based on net amounts
    const newStatus = 
      totalRefunded >= grossPaid ? 'REFUNDED' : 
      netPaidAmount > 0 ? 'PARTIALLY_PAID' : 
      'DRAFT'

    // Update invoice with complete refund tracking
    const updatedInvoice = await tx.invoice.update({
      where: { id: params.invoiceId },
      data: {
        paidAmount: netPaidAmount,
        balanceAmount,
        status: newStatus,
      },
    })

    return { refund, invoice: updatedInvoice }
  })
}
