import { prisma } from '@/lib/prisma'
import { PaymentGateway, PaymentMethod, TransactionStatus } from '@prisma/client'
import { ReferralService } from './referralService'

export interface CheckoutData {
  branchId: string
  memberId: string
  membershipPlanId: string
  paymentMethod: PaymentMethod
  paymentGateway?: PaymentGateway
  referralCode?: string
  customDiscount?: number
  notes?: string
}

export interface PaymentData {
  invoiceId: string
  amount: number
  paymentMethod: PaymentMethod
  paymentGateway: PaymentGateway
  gatewayOrderId?: string
  gatewayPaymentId?: string
  gatewaySignature?: string
  metadata?: any
}

export class CheckoutService {
  static async createMembershipCheckout(data: CheckoutData, tenantId: string) {
    const member = await prisma.member.findUnique({
      where: { id: data.memberId },
    })

    if (!member) {
      throw new Error('Member not found')
    }

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: data.membershipPlanId },
    })

    if (!plan) {
      throw new Error('Membership plan not found')
    }

    let referralDiscount = 0
    let referralTracking = null

    // Process referral code if provided
    if (data.referralCode) {
      const referralValidation = await ReferralService.validateReferralCode(data.referralCode, data.branchId)
      
      if (referralValidation.valid && referralValidation.referrer) {
        // Apply 10% discount for referral
        referralDiscount = Math.round(plan.price * 0.1)
        
        // Create referral tracking
        referralTracking = await ReferralService.createReferral({
          referrerMemberId: referralValidation.referrer.id,
          referredMemberId: data.memberId,
          branchId: data.branchId,
          bonusAmount: 500, // ₹500 bonus for referrer
          bonusType: 'CREDIT',
        }, tenantId)
      }
    }

    const totalDiscount = referralDiscount + (data.customDiscount || 0)
    const finalAmount = Math.max(0, plan.price + plan.setupFee - totalDiscount)

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { branchId: data.branchId }
    })
    const invoiceNumber = `INV-${data.branchId.slice(-4).toUpperCase()}-${String(invoiceCount + 1).padStart(4, '0')}`

    const result = await prisma.$transaction(async (tx) => {
      // Create membership assignment
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000)

      const membership = await tx.memberMembership.create({
        data: {
          memberId: data.memberId,
          planId: data.membershipPlanId,
          branchId: data.branchId,
          startDate,
          endDate,
          status: 'PENDING', // Will be activated after payment
          notes: data.notes,
        },
      })

      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          branchId: data.branchId,
          invoiceNumber,
          memberId: data.memberId,
          membershipId: membership.id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          subtotal: plan.price + plan.setupFee,
          discountAmount: totalDiscount,
          totalAmount: finalAmount,
          status: 'DRAFT',
          notes: `Membership: ${plan.name}${data.referralCode ? ` (Referral: ${data.referralCode})` : ''}`,
          metadata: {
            referralCode: data.referralCode,
            referralDiscount,
            customDiscount: data.customDiscount,
          },
        },
      })

      return { membership, invoice, referralTracking }
    })

    return result
  }

  static async processPayment(data: PaymentData): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      include: {
        membership: true,
        member: true,
      },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    await prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          tenantId: invoice.tenantId,
          branchId: invoice.branchId,
          invoiceId: invoice.id,
          memberId: invoice.memberId,
          transactionType: 'MEMBERSHIP',
          paymentMethod: data.paymentMethod,
          paymentGateway: data.paymentGateway,
          amount: data.amount,
          status: 'COMPLETED',
          gatewayOrderId: data.gatewayOrderId,
          gatewayPaymentId: data.gatewayPaymentId,
          gatewaySignature: data.gatewaySignature,
          gatewayResponse: data.metadata,
          processedAt: new Date(),
        },
      })

      // Update invoice
      const newPaidAmount = Number(invoice.paidAmount) + data.amount
      const newBalanceAmount = Number(invoice.totalAmount) - newPaidAmount

      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: Math.max(0, newBalanceAmount),
          status: newBalanceAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID',
        },
      })

      // Activate membership if fully paid
      if (newBalanceAmount <= 0 && invoice.membership) {
        await tx.memberMembership.update({
          where: { id: invoice.membershipId! },
          data: { status: 'ACTIVE' },
        })

        // Update member status
        await tx.member.update({
          where: { id: invoice.memberId! },
          data: { status: 'ACTIVE' },
        })
      }

      // Process referral bonus if applicable
      if (invoice.metadata && invoice.metadata.referralCode) {
        const referralTracking = await tx.referralTracking.findFirst({
          where: {
            referredMemberId: invoice.memberId!,
            isProcessed: false,
          },
        })

        if (referralTracking) {
          await tx.referralTracking.update({
            where: { id: referralTracking.id },
            data: {
              isProcessed: true,
              processedAt: new Date(),
            },
          })

          // Add bonus to referrer
          await tx.member.update({
            where: { id: referralTracking.referrerMemberId },
            data: {
              referralBonus: {
                increment: referralTracking.bonusAmount,
              },
            },
          })
        }
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          tenantId: invoice.tenantId,
          branchId: invoice.branchId,
          userId: 'system', // Payment processing is automated
          action: 'PAYMENT_PROCESSED',
          resource: 'transactions',
          resourceId: transaction.id,
          newData: transaction,
          metadata: {
            invoiceId: invoice.id,
            amount: data.amount,
            paymentMethod: data.paymentMethod,
          },
        },
      })
    })
  }

  static async createPaymentLink(invoiceId: string, gateway: PaymentGateway = 'RAZORPAY') {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { member: true, branch: true },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    // Get payment gateway configuration
    const gatewayConfig = await prisma.paymentGatewayConfig.findFirst({
      where: {
        tenantId: invoice.tenantId,
        gateway,
        isActive: true,
      },
    })

    if (!gatewayConfig) {
      throw new Error(`Payment gateway ${gateway} not configured`)
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

  static async handlePaymentWebhook(
    gateway: PaymentGateway,
    payload: any,
    signature?: string
  ) {
    // Verify webhook signature (implementation depends on gateway)
    const isValid = this.verifyWebhookSignature(gateway, payload, signature)
    
    if (!isValid) {
      throw new Error('Invalid webhook signature')
    }

    const { orderId, paymentId, amount, status } = payload
    
    // Find invoice by gateway order ID
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [
          { gatewayOrderId: orderId },
          { invoiceNumber: orderId }, // Fallback
        ],
      },
    })

    if (!invoice) {
      throw new Error('Invoice not found for order ID')
    }

    if (status === 'success' || status === 'captured') {
      await this.processPayment({
        invoiceId: invoice.id,
        amount: Number(amount) / 100, // Convert from paise to rupees
        paymentMethod: 'ONLINE',
        paymentGateway: gateway,
        gatewayOrderId: orderId,
        gatewayPaymentId: paymentId,
        gatewaySignature: signature,
        metadata: payload,
      })
    } else {
      // Handle failed payment
      await prisma.transaction.create({
        data: {
          tenantId: invoice.tenantId,
          branchId: invoice.branchId,
          invoiceId: invoice.id,
          memberId: invoice.memberId,
          transactionType: 'MEMBERSHIP',
          paymentMethod: 'ONLINE',
          paymentGateway: gateway,
          amount: Number(amount) / 100,
          status: 'FAILED',
          gatewayOrderId: orderId,
          gatewayPaymentId: paymentId,
          gatewayResponse: payload,
          notes: `Payment failed: ${payload.error_description || 'Unknown error'}`,
        },
      })
    }
  }

  private static verifyWebhookSignature(gateway: PaymentGateway, payload: any, signature?: string): boolean {
    // Mock verification - implement actual signature verification for each gateway
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
      case 'CCAVENUE':
        // Implement CCAvenue signature verification
        return true
      default:
        return false
    }
  }
}