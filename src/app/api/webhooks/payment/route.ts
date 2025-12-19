import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/libs/prisma'
import { PaymentMethod } from '@prisma/client'
import { reconcileInvoicePayment, reconcileInvoiceRefund } from '@/libs/invoiceReconciliation'
import crypto from 'crypto'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature') || request.headers.get('x-webhook-signature')

    // Verify webhook signature for security (REQUIRED when secret is configured)
    if (WEBHOOK_SECRET) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature header' }, { status: 401 })
      }

      const isValid = verifyWebhookSignature(body, signature, WEBHOOK_SECRET)
      if (!isValid) {
        await logWebhookEvent({
          gateway: 'STRIPE',
          eventType: 'payment.webhook',
          eventId: undefined,
          payload: body,
          signature,
        })
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload = JSON.parse(body)
    
    // Log webhook event for audit trail
    const webhookEvent = await logWebhookEvent({
      gateway: 'STRIPE',
      eventType: payload.type || payload.event,
      eventId: payload.id,
      payload: body,
      signature: signature || undefined,
    })

    // Process based on event type
    let result
    switch (payload.type) {
      case 'payment_intent.succeeded':
      case 'charge.succeeded':
        result = await handlePaymentSuccess(payload)
        break
      
      case 'payment_intent.payment_failed':
      case 'charge.failed':
        result = await handlePaymentFailed(payload)
        break
      
      case 'refund.created':
        result = await handleRefundCreated(payload)
        break
      
      default:
        console.log(`Unhandled webhook event: ${payload.type}`)
        result = { success: true, message: 'Event type not handled' }
    }

    // Update webhook event status
    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        isProcessed: true,
        isVerified: true,
        processedAt: new Date(),
        errorMessage: result.error,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(payload: any) {
  const invoiceId = payload.data?.object?.metadata?.invoiceId
  const orderId = payload.data?.object?.metadata?.orderId
  const amount = payload.data?.object?.amount_received / 100 // Convert from cents
  const paymentId = payload.data?.object?.id

  if (invoiceId) {
    // Use centralized reconciliation for consistency and correctness
    try {
      await reconcileInvoicePayment({
        invoiceId,
        amount,
        paymentMethod: PaymentMethod.UPI,
        gatewayPaymentId: paymentId,
        processedBy: 'SYSTEM',
      })
      return { success: true, message: 'Invoice payment processed' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to process invoice payment' }
    }
  }

  if (orderId) {
    // Update POS order payment
    try {
      await prisma.orderPayment.create({
        data: {
          orderId,
          amount,
          paymentMethod: PaymentMethod.UPI,
          gatewayPaymentId: paymentId,
          status: 'COMPLETED',
        },
      })
      return { success: true, message: 'Order payment processed' }
    } catch (error) {
      return { success: false, error: 'Failed to process order payment' }
    }
  }

  return { success: false, error: 'No invoice or order ID in metadata' }
}

async function handlePaymentFailed(payload: any) {
  const invoiceId = payload.data?.object?.metadata?.invoiceId
  const orderId = payload.data?.object?.metadata?.orderId
  const errorMessage = payload.data?.object?.last_payment_error?.message

  if (invoiceId) {
    await prisma.invoicePayment.create({
      data: {
        invoiceId,
        amount: 0,
        paymentMethod: PaymentMethod.UPI,
        status: 'FAILED',
        notes: `Payment failed: ${errorMessage || 'Unknown error'}`,
        processedBy: 'SYSTEM',
      },
    })
    return { success: true, message: 'Payment failure logged' }
  }

  if (orderId) {
    await prisma.orderPayment.create({
      data: {
        orderId,
        amount: 0,
        paymentMethod: PaymentMethod.UPI,
        status: 'FAILED',
      },
    })
    return { success: true, message: 'Payment failure logged' }
  }

  return { success: false, error: 'No invoice or order ID in metadata' }
}

async function handleRefundCreated(payload: any) {
  const refundId = payload.data?.object?.id
  const amount = payload.data?.object?.amount / 100
  const chargeId = payload.data?.object?.charge

  // Find the invoice payment by gateway payment ID
  const invoicePayment = await prisma.invoicePayment.findFirst({
    where: { gatewayPaymentId: chargeId },
  })

  if (invoicePayment) {
    // Use centralized reconciliation for consistency and correctness
    try {
      await reconcileInvoiceRefund({
        invoiceId: invoicePayment.invoiceId,
        refundAmount: amount,
        refundMethod: PaymentMethod.UPI,
        reason: 'Gateway refund',
        gatewayRefundId: refundId,
        processedBy: 'SYSTEM',
      })
      return { success: true, message: 'Refund processed' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to process refund' }
    }
  }

  return { success: false, error: 'No matching payment found for refund' }
}

async function logWebhookEvent(data: {
  gateway: string
  eventType: string
  eventId?: string
  payload: string
  signature?: string
}) {
  return await prisma.webhookEvent.create({
    data: {
      tenantId: 'SYSTEM',
      gateway: data.gateway as any,
      eventType: data.eventType,
      eventId: data.eventId,
      payload: data.payload,
      signature: data.signature,
      isVerified: false,
      isProcessed: false,
    },
  })
}

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    // Stripe signature format: t=timestamp,v1=signature
    const signatureParts = signature.split(',')
    const timestamp = signatureParts.find(p => p.startsWith('t='))?.split('=')[1]
    const sig = signatureParts.find(p => p.startsWith('v1='))?.split('=')[1]

    if (!timestamp || !sig) {
      return false
    }

    // Create expected signature
    const signedPayload = `${timestamp}.${payload}`
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex')

    // Constant-time comparison
    return crypto.timingSafeEqual(
      Buffer.from(sig),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}
