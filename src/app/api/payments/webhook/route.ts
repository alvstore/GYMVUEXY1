import { headers } from 'next/headers'
import { prisma } from '@/libs/prisma'
import { AuditLogger } from '@/libs/auditLogger'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return new Response('No signature', { status: 400 })
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!stripeSecretKey || !webhookSecret) {
      return new Response('Webhook secret not configured', { status: 500 })
    }

    const Stripe = (await import('stripe')).default
    const stripeClient = new Stripe(stripeSecretKey)

    let event
    try {
      event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Signature verification failed', { status: 400 })
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any

      if (session.payment_status === 'paid') {
        const { memberId, planId, tenantId, branchId } = session.metadata

        try {
          // Create membership
          const plan = await prisma.membershipPlan.findUnique({
            where: { id: planId },
            select: { duration: true },
          })

          if (!plan) {
            throw new Error('Plan not found')
          }

          const startDate = new Date()
          const endDate = new Date()
          endDate.setDate(endDate.getDate() + plan.duration)

          const membership = await prisma.memberMembership.create({
            data: {
              memberId,
              planId,
              startDate,
              endDate,
              status: 'ACTIVE',
              branchId,
            },
          })

          // Create payment transaction record
          await prisma.transaction.create({
            data: {
              tenantId,
              branchId,
              memberId,
              transactionType: 'MEMBERSHIP',
              paymentMethod: 'CARD',
              paymentGateway: 'STRIPE',
              amount: session.amount_total / 100, // Convert from cents
              currency: session.currency?.toUpperCase() || 'INR',
              gatewayOrderId: session.id,
              gatewayPaymentId: session.payment_intent,
              status: 'SUCCESS',
              processedAt: new Date(),
              gatewayResponse: {
                sessionId: session.id,
                customerId: session.customer,
              },
            },
          })

          // Log transaction
          const auditContext = { userId: 'system', tenantId, branchId }
          await AuditLogger.log({
            userId: 'system',
            tenantId,
            branchId,
            action: 'Payment.completed',
            resource: 'Transaction',
            resourceId: session.id,
            newValues: {
              memberId,
              planId,
              amount: session.amount_total / 100,
              membershipId: membership.id,
            },
          })

          console.log(`✅ Payment processed: ${session.id} - Membership activated for member ${memberId}`)
        } catch (error) {
          console.error('Error processing payment:', error)
          return new Response('Error processing payment', { status: 500 })
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Webhook error', { status: 400 })
  }
}
