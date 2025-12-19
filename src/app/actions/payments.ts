'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'
import { revalidatePath } from 'next/cache'

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
