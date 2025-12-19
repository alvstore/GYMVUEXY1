'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission, getAuthContext } from '@/libs/serverAuth'
import { nanoid } from 'nanoid'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-11-17.clover' as any })

async function validateMemberAccess(memberId: string) {
  const context = await requirePermission('self.update')
  
  const member = await prisma.member.findFirst({
    where: { 
      id: memberId,
      tenantId: context.tenantId!,
      email: context.email,
    },
  })
  
  if (!member) {
    throw new Error('Unauthorized: You can only access your own cart')
  }
  
  return { context, member }
}

async function validateCartItemAccess(cartItemId: string) {
  const context = await requirePermission('self.update')
  
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: { include: { member: true } } },
  })
  
  if (!cartItem) {
    throw new Error('Cart item not found')
  }
  
  if (cartItem.cart.tenantId !== context.tenantId || cartItem.cart.member.email !== context.email) {
    throw new Error('Unauthorized: You can only modify your own cart')
  }
  
  return { context, cartItem }
}

export async function getActiveCart(memberId: string) {
  const { context, member } = await validateMemberAccess(memberId)
  
  const cart = await prisma.cart.findFirst({
    where: { memberId: member.id, status: 'ACTIVE', tenantId: context.tenantId! },
    include: { items: { include: { product: true } } },
  })
  return cart
}

export async function addToCart(memberId: string, productId: string, quantity: number = 1) {
  const { context, member } = await validateMemberAccess(memberId)
  
  const product = await prisma.product.findFirst({ 
    where: { id: productId, tenantId: context.tenantId! } 
  })
  if (!product || product.stockQuantity < quantity) {
    throw new Error('Product not available')
  }

  let cart = await prisma.cart.findFirst({
    where: { memberId: member.id, status: 'ACTIVE', tenantId: context.tenantId! },
  })

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        tenantId: context.tenantId!,
        branchId: product.branchId,
        memberId: member.id,
        status: 'ACTIVE',
      },
    })
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId },
  })

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    })
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        unitPrice: product.sellingPrice,
      },
    })
  }

  return getActiveCart(member.id)
}

export async function updateCartItem(cartItemId: string, quantity: number) {
  const { context, cartItem } = await validateCartItemAccess(cartItemId)

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: cartItemId } })
  } else {
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    })
  }
}

export async function removeFromCart(cartItemId: string) {
  const { context, cartItem } = await validateCartItemAccess(cartItemId)
  await prisma.cartItem.delete({ where: { id: cartItemId } })
}

export async function createCheckoutSession(memberId: string) {
  const { context, member } = await validateMemberAccess(memberId)

  const cart = await prisma.cart.findFirst({
    where: { memberId: member.id, status: 'ACTIVE', tenantId: context.tenantId! },
    include: { items: { include: { product: true } }, member: true },
  })

  if (!cart || cart.items.length === 0) {
    throw new Error('Cart is empty')
  }

  const subtotal = cart.items.reduce((sum: number, item: any) => {
    return sum + Number(item.unitPrice) * item.quantity
  }, 0)
  const taxAmount = subtotal * 0.18
  const totalAmount = subtotal + taxAmount

  const order = await prisma.customerOrder.create({
    data: {
      tenantId: cart.tenantId,
      branchId: cart.branchId,
      memberId: member.id,
      orderNumber: `ORD-${nanoid(8).toUpperCase()}`,
      subtotal,
      taxAmount,
      totalAmount,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      items: {
        create: cart.items.map((item: any) => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.product.taxRate,
          totalAmount: Number(item.unitPrice) * item.quantity,
        })),
      },
    },
  })

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: cart.items.map((item: any) => ({
      price_data: {
        currency: 'inr',
        product_data: { name: item.product.name },
        unit_amount: Math.round(Number(item.unitPrice) * 100),
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    success_url: `${process.env.NEXTAUTH_URL}/apps/orders?success=true&order=${order.id}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/apps/cart?cancelled=true`,
    metadata: { orderId: order.id, memberId: member.id },
  })

  await prisma.customerOrder.update({
    where: { id: order.id },
    data: { stripeSessionId: session.id },
  })

  await prisma.cart.update({
    where: { id: cart.id },
    data: { status: 'CONVERTED' },
  })

  return { sessionId: session.id, url: session.url }
}

export async function getMemberOrders(memberId: string) {
  const { context, member } = await validateMemberAccess(memberId)
  
  const orders = await prisma.customerOrder.findMany({
    where: { memberId: member.id, tenantId: context.tenantId! },
    include: { items: true },
    orderBy: { orderDate: 'desc' },
    take: 20,
  })
  return orders
}

export async function getOrderDetails(orderId: string) {
  const context = await requirePermission('orders.view')
  
  const order = await prisma.customerOrder.findFirst({
    where: { id: orderId, tenantId: context.tenantId! },
    include: { items: { include: { product: true } }, member: true },
  })
  
  if (!order) {
    throw new Error('Order not found')
  }
  
  return order
}

export async function fulfillOrder(orderId: string) {
  const context = await requirePermission('orders.update')
  
  const order = await prisma.customerOrder.findFirst({
    where: { id: orderId, tenantId: context.tenantId! },
  })
  
  if (!order) {
    throw new Error('Order not found')
  }
  
  const updatedOrder = await prisma.customerOrder.update({
    where: { id: orderId },
    data: {
      status: 'DELIVERED',
      fulfilledAt: new Date(),
    },
  })

  const items = await prisma.customerOrderItem.findMany({ where: { orderId } })
  
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stockQuantity: { decrement: item.quantity } },
    })
  }

  return updatedOrder
}
