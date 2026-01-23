'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'
import { revalidatePath } from 'next/cache'
import { sendPaymentConfirmation } from '@/libs/notifications'
import { Prisma } from '@prisma/client'

function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `INV-${year}${month}-${random}`
}

export async function getMembershipPlans(memberId?: string) {
  const context = await requirePermission('plans.view')

  const plans = await prisma.membershipPlan.findMany({
    where: {
      tenantId: context.tenantId,
      status: 'ACTIVE',
      OR: [{ branchId: context.branchId }, { branchId: null }],
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      setupFee: true,
      duration: true,
      gymAccess: true,
      poolAccess: true,
      lockerAccess: true,
      personalTrainer: true,
      groupClasses: true,
      maxClasses: true,
      features: true,
    },
    orderBy: { price: 'asc' },
  })

  return {
    success: true,
    plans: plans.map((p) => ({
      ...p,
      price: Number(p.price),
      setupFee: Number(p.setupFee),
    })),
  }
}

export async function createCheckoutSession(data: {
  memberId: string
  planId: string
  successUrl?: string
  cancelUrl?: string
}) {
  const context = await requirePermission('payments.create')

  try {
    // Validate member exists
    const member = await prisma.member.findFirst({
      where: {
        id: data.memberId,
        tenantId: context.tenantId,
        branchId: context.branchId,
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    })

    if (!member) {
      throw new Error('Member not found')
    }

    // Validate plan exists
    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: data.planId,
        tenantId: context.tenantId,
        status: 'ACTIVE',
      },
      select: { id: true, name: true, price: true, setupFee: true, duration: true },
    })

    if (!plan) {
      throw new Error('Plan not found or inactive')
    }

    // Calculate total amount (price + setup fee)
    const totalAmount = Number(plan.price) + Number(plan.setupFee)

    // Create Stripe checkout session (requires Stripe secret key)
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      throw new Error('Stripe not configured')
    }

    // Import Stripe dynamically to avoid issues if not installed
    const Stripe = (await import('stripe')).default
    const stripeClient = new Stripe(stripeSecretKey)

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: plan.name,
              description: `${plan.duration}-day membership`,
            },
            unit_amount: Math.round(totalAmount * 100), // Stripe expects amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: member.email,
      metadata: {
        memberId: data.memberId,
        planId: data.planId,
        tenantId: context.tenantId,
        branchId: context.branchId,
      },
      success_url: data.successUrl || `${process.env.NEXTAUTH_URL}/apps/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: data.cancelUrl || `${process.env.NEXTAUTH_URL}/apps/billing/cancel`,
    })

    // Log payment initiation
    await AuditLogger.log({
      userId: context.userId,
      tenantId: context.tenantId,
      branchId: context.branchId,
      action: 'Payment.checkoutInitiated',
      resource: 'Transaction',
      resourceId: session.id,
      newValues: {
        memberId: data.memberId,
        planName: plan.name,
        amount: totalAmount,
        sessionId: session.id,
      },
    })

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
    }
  }
}

export async function activateMembership(data: {
  memberId: string
  planId: string
  transactionId?: string
  notes?: string
}) {
  const context = await requirePermission('memberships.create')

  try {
    // Get plan details
    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: data.planId,
        tenantId: context.tenantId,
      },
      select: { id: true, name: true, duration: true },
    })

    if (!plan) {
      throw new Error('Plan not found')
    }

    // Calculate dates
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + plan.duration)

    // Create membership
    const membership = await prisma.memberMembership.create({
      data: {
        memberId: data.memberId,
        planId: data.planId,
        startDate,
        endDate,
        status: 'ACTIVE',
        branchId: context.branchId,
        notes: data.notes,
      },
    })

    // Log membership activation
    await AuditLogger.log({
      userId: context.userId,
      tenantId: context.tenantId,
      branchId: context.branchId,
      action: 'Membership.activated',
      resource: 'MemberMembership',
      resourceId: membership.id,
      newValues: {
        planId: data.planId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        transactionId: data.transactionId,
      },
    })

    revalidatePath('/apps/billing')
    revalidatePath(`/apps/members/${data.memberId}`)

    return {
      success: true,
      membership: {
        id: membership.id,
        memberId: membership.memberId,
        planId: membership.planId,
        startDate: membership.startDate,
        endDate: membership.endDate,
        status: membership.status,
      },
    }
  } catch (error) {
    console.error('Error activating membership:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to activate membership',
    }
  }
}

export async function getPaymentStatus(sessionId: string) {
  const context = await requirePermission('payments.view')

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      throw new Error('Stripe not configured')
    }

    const Stripe = (await import('stripe')).default
    const stripeClient = new Stripe(stripeSecretKey)

    const session = await stripeClient.checkout.sessions.retrieve(sessionId)

    // Log payment status check
    await AuditLogger.log({
      userId: context.userId,
      tenantId: context.tenantId,
      branchId: context.branchId,
      action: 'Payment.statusChecked',
      resource: 'Transaction',
      resourceId: sessionId,
    })

    return {
      success: true,
      status: session.payment_status,
      sessionId: session.id,
      metadata: session.metadata,
    }
  } catch (error) {
    console.error('Error getting payment status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment status',
    }
  }
}

export async function processMembershipPayment(data: {
  memberId: string
  planId: string
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE'
  amount: number
  discount?: number
  notes?: string
  sendNotifications?: boolean
}): Promise<{ success: boolean; invoiceId: string; membershipId: string; notifications?: { emailSent: boolean; smsSent: boolean; whatsappSent: boolean } }> {
  const context = await requirePermission('billing.create')

  const member = await prisma.member.findFirst({
    where: {
      id: data.memberId,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
  })

  if (!member) {
    throw new Error('Member not found')
  }

  const plan = await prisma.membershipPlan.findFirst({
    where: {
      id: data.planId,
      tenantId: context.tenantId,
      status: 'ACTIVE',
    },
    include: { benefits: true },
  })

  if (!plan) {
    throw new Error('Membership plan not found')
  }

  const branchId = member.branchId || context.branchId
  if (!branchId) {
    throw new Error('Branch ID is required')
  }

  const subtotal = new Prisma.Decimal(data.amount)
  const discountAmount = new Prisma.Decimal(data.discount || 0)
  const taxRate = new Prisma.Decimal(0.18)
  const taxableAmount = subtotal.minus(discountAmount)
  const taxAmount = taxableAmount.times(taxRate)
  const totalAmount = taxableAmount.plus(taxAmount)

  const invoiceNumber = generateInvoiceNumber()
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + plan.duration)

  const result = await prisma.$transaction(async (tx) => {
    const membership = await tx.memberMembership.create({
      data: {
        memberId: data.memberId,
        planId: data.planId,
        branchId,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
    })

    const invoice = await tx.invoice.create({
      data: {
        tenantId: context.tenantId,
        branchId,
        invoiceNumber,
        memberId: data.memberId,
        membershipId: membership.id,
        customerName: `${member.firstName} ${member.lastName}`,
        customerEmail: member.email,
        customerPhone: member.phone,
        issueDate: new Date(),
        dueDate: new Date(),
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paidAmount: totalAmount,
        balanceAmount: new Prisma.Decimal(0),
        cgstAmount: taxAmount.dividedBy(2),
        sgstAmount: taxAmount.dividedBy(2),
        igstAmount: new Prisma.Decimal(0),
        paymentMethod: data.paymentMethod,
        status: 'PAID',
        items: {
          create: {
            description: `${plan.name} - ${plan.duration} days membership`,
            quantity: 1,
            unitPrice: subtotal,
            taxRate,
            discount: discountAmount,
            totalAmount: subtotal,
          },
        },
      },
    })

    await tx.invoicePayment.create({
      data: {
        invoiceId: invoice.id,
        paymentMethod: data.paymentMethod,
        amount: totalAmount,
        status: 'COMPLETED',
        processedBy: context.userId,
      },
    })

    await tx.transaction.create({
      data: {
        tenantId: context.tenantId,
        branchId,
        invoiceId: invoice.id,
        memberId: data.memberId,
        userId: context.userId,
        transactionType: 'MEMBERSHIP',
        amount: totalAmount,
        currency: 'INR',
        paymentMethod: data.paymentMethod,
        status: 'COMPLETED',
        notes: data.notes || `Membership: ${plan.name}`,
      },
    })

    await tx.membershipLifecycleEvent.create({
      data: {
        tenantId: context.tenantId,
        branchId,
        memberId: data.memberId,
        membershipId: membership.id,
        eventType: 'ACTIVATED',
        effectiveDate: startDate,
        newData: { planId: data.planId, planName: plan.name, endDate },
        performedBy: context.userId,
      },
    })

    for (const benefit of plan.benefits) {
      await tx.memberBenefitBalance.upsert({
        where: {
          memberId_benefitId: {
            memberId: data.memberId,
            benefitId: benefit.id,
          },
        },
        create: {
          tenantId: context.tenantId,
          branchId,
          memberId: data.memberId,
          benefitId: benefit.id,
          currentBalance: benefit.accrualQuantity,
          totalAccrued: benefit.accrualQuantity,
          expiryDate: endDate,
        },
        update: {
          currentBalance: { increment: benefit.accrualQuantity },
          totalAccrued: { increment: benefit.accrualQuantity },
          expiryDate: endDate,
        },
      })
    }

    return { membership, invoice }
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId,
    action: 'Payment.processed',
    resource: 'Invoice',
    resourceId: result.invoice.id,
    newValues: {
      invoiceNumber,
      memberId: data.memberId,
      planId: data.planId,
      amount: totalAmount.toNumber(),
      paymentMethod: data.paymentMethod,
    },
  })

  revalidatePath('/dashboards/admin')
  revalidatePath('/dashboards/manager')
  revalidatePath(`/apps/members/${data.memberId}`)

  let notifications: { emailSent: boolean; smsSent: boolean; whatsappSent: boolean } | undefined

  if (data.sendNotifications !== false) {
    notifications = await sendPaymentConfirmation(
      {
        tenantId: context.tenantId,
        branchId,
        memberId: data.memberId,
        userId: context.userId,
      },
      {
        memberName: `${member.firstName} ${member.lastName}`,
        memberEmail: member.email || undefined,
        memberPhone: member.phone,
        invoiceNumber,
        amount: totalAmount.toNumber(),
        planName: plan.name,
        validUntil: endDate,
      }
    )
  }

  return {
    success: true,
    invoiceId: result.invoice.id,
    membershipId: result.membership.id,
    notifications,
  }
}

export async function getInvoice(invoiceId: string) {
  const context = await requirePermission('billing.view')

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    include: {
      items: true,
      payments: true,
      member: true,
      membership: { include: { plan: true } },
      branch: true,
    },
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  return invoice
}

export async function getInvoices(filters?: {
  memberId?: string
  status?: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED'
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}) {
  const context = await requirePermission('billing.view')

  const page = filters?.page || 1
  const limit = filters?.limit || 20
  const skip = (page - 1) * limit

  const where: Prisma.InvoiceWhereInput = {
    tenantId: context.tenantId,
    ...(context.branchId && { branchId: context.branchId }),
    ...(filters?.memberId && { memberId: filters.memberId }),
    ...(filters?.status && { status: filters.status as any }),
    ...(filters?.startDate && { issueDate: { gte: filters.startDate } }),
    ...(filters?.endDate && { issueDate: { lte: filters.endDate } }),
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        member: { select: { firstName: true, lastName: true, membershipId: true } },
        branch: { select: { name: true } },
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

export async function recordManualPayment(data: {
  invoiceId: string
  amount: number
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE'
  transactionRef?: string
  notes?: string
  sendNotifications?: boolean
}) {
  const context = await requirePermission('billing.create')

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: data.invoiceId,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    include: { 
      member: true,
      membership: { include: { plan: true } },
    },
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  const paymentAmount = new Prisma.Decimal(data.amount)
  const newPaidAmount = invoice.paidAmount.plus(paymentAmount)
  const newBalanceAmount = invoice.totalAmount.minus(newPaidAmount)
  const newStatus = newBalanceAmount.lte(0) ? 'PAID' : 'PARTIALLY_PAID'

  await prisma.$transaction(async (tx) => {
    await tx.invoicePayment.create({
      data: {
        invoiceId: data.invoiceId,
        paymentMethod: data.paymentMethod,
        amount: paymentAmount,
        transactionRef: data.transactionRef,
        status: 'COMPLETED',
        processedBy: context.userId,
        notes: data.notes,
      },
    })

    await tx.invoice.update({
      where: { id: data.invoiceId },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount.lte(0) ? new Prisma.Decimal(0) : newBalanceAmount,
        status: newStatus,
      },
    })

    await tx.transaction.create({
      data: {
        tenantId: context.tenantId,
        branchId: invoice.branchId,
        invoiceId: data.invoiceId,
        memberId: invoice.memberId,
        userId: context.userId,
        transactionType: 'MEMBERSHIP',
        amount: paymentAmount,
        currency: 'INR',
        paymentMethod: data.paymentMethod,
        status: 'COMPLETED',
        notes: data.notes || `Payment for Invoice ${invoice.invoiceNumber}`,
      },
    })
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: invoice.branchId,
    action: 'Payment.recorded',
    resource: 'Invoice',
    resourceId: data.invoiceId,
    newValues: {
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      newStatus,
    },
  })

  revalidatePath('/dashboards/admin')
  revalidatePath('/dashboards/manager')

  if (data.sendNotifications !== false && invoice.member && newStatus === 'PAID') {
    await sendPaymentConfirmation(
      {
        tenantId: context.tenantId,
        branchId: invoice.branchId,
        memberId: invoice.memberId || undefined,
        userId: context.userId,
      },
      {
        memberName: `${invoice.member.firstName} ${invoice.member.lastName}`,
        memberEmail: invoice.member.email || undefined,
        memberPhone: invoice.member.phone,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.totalAmount.toNumber(),
        planName: invoice.membership?.plan?.name || 'Membership',
        validUntil: invoice.membership?.endDate || new Date(),
      }
    )
  }

  return { success: true, newStatus }
}
