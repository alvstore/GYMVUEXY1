'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { ValidationHelper } from '@/libs/validation'
import { AuditLogger } from '@/libs/auditLogger'

export async function createCoupon(data: {
  code: string
  name: string
  description?: string
  discountType: 'PERCENTAGE' | 'FLAT_AMOUNT' | 'FREE_MONTHS' | 'FREE_ADDON'
  discountValue: number
  validFrom: Date
  validUntil: Date
  maxUsageCount?: number
  minPurchaseAmount?: number
  applicablePlans?: string[]
  isReferralCoupon: boolean
}) {
  const context = await requirePermission('coupons.create')

  if (!ValidationHelper.validateCouponCode(data.code)) {
    throw new Error('Invalid coupon code format')
  }

  if (data.discountType === 'PERCENTAGE' && !ValidationHelper.validatePercentage(data.discountValue)) {
    throw new Error('Discount percentage must be between 0 and 100')
  }

  const existing = await prisma.coupon.findFirst({
    where: {
      code: data.code.toUpperCase(),
      tenantId: context.tenantId,
    },
  })

  if (existing) throw new Error('Coupon code already exists')

  const coupon = await prisma.coupon.create({
    data: {
      tenantId: context.tenantId,
      branchId: context.branchId,
      code: data.code.toUpperCase(),
      name: data.name,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      maxUsageCount: data.maxUsageCount,
      currentUsageCount: 0,
      minPurchaseAmount: data.minPurchaseAmount,
      applicablePlans: data.applicablePlans || [],
      isReferralCoupon: data.isReferralCoupon,
      status: 'ACTIVE',
    },
  })

  await AuditLogger.logCreate(
    context.userId,
    context.tenantId,
    'Coupon',
    coupon.id,
    coupon as any,
    context.branchId
  )

  return coupon
}

export async function validateCoupon(code: string, planId?: string, amount?: number) {
  const context = await requirePermission('coupons.view')

  const coupon = await prisma.coupon.findFirst({
    where: {
      code: code.toUpperCase(),
      tenantId: context.tenantId,
      status: 'ACTIVE',
    },
  })

  if (!coupon) {
    return { valid: false, error: 'Invalid coupon code' }
  }

  const now = new Date()
  if (now < coupon.validFrom || now > coupon.validUntil) {
    return { valid: false, error: 'Coupon expired or not yet valid' }
  }

  if (coupon.maxUsageCount && coupon.currentUsageCount >= coupon.maxUsageCount) {
    return { valid: false, error: 'Coupon usage limit reached' }
  }

  if (planId && coupon.applicablePlans.length > 0 && !coupon.applicablePlans.includes(planId)) {
    return { valid: false, error: 'Coupon not applicable to selected plan' }
  }

  if (amount && coupon.minPurchaseAmount && amount < coupon.minPurchaseAmount) {
    return { valid: false, error: `Minimum purchase amount is ${coupon.minPurchaseAmount}` }
  }

  return { valid: true, coupon }
}

export async function applyCoupon(data: {
  couponCode: string
  memberId: string
  invoiceId?: string
  amount: number
}) {
  const context = await requirePermission('coupons.apply')

  const validation = await validateCoupon(data.couponCode, undefined, data.amount)

  if (!validation.valid || !validation.coupon) {
    throw new Error(validation.error || 'Invalid coupon')
  }

  const usage = await prisma.couponUsage.create({
    data: {
      tenantId: context.tenantId,
      branchId: context.branchId,
      couponId: validation.coupon.id,
      couponCode: validation.coupon.code,
      memberId: data.memberId,
      invoiceId: data.invoiceId,
      discountType: validation.coupon.discountType,
      discountValue: validation.coupon.discountValue,
      originalAmount: data.amount,
      appliedBy: context.userId,
    },
  })

  await prisma.coupon.update({
    where: { id: validation.coupon.id },
    data: { currentUsageCount: { increment: 1 } },
  })

  return usage
}

export async function getCoupons(filters?: {
  status?: string
  search?: string
}) {
  const context = await requirePermission('coupons.view')

  const coupons = await prisma.coupon.findMany({
    where: {
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
      ...(filters?.status && { status: filters.status as any }),
      ...(filters?.search && {
        OR: [
          { code: { contains: filters.search, mode: 'insensitive' } },
          { name: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    },
    orderBy: { createdAt: 'desc' },
  })

  return coupons
}
