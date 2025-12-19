'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'
import { ReferralCodeGenerator } from '@/libs/referral'
import { revalidatePath } from 'next/cache'

// Helper function to calculate next accrual date
function calculateNextAccrual(startDate: Date, accrualType: string): Date {
  const nextDate = new Date(startDate)
  
  switch (accrualType) {
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case 'QUARTERLY':
      nextDate.setMonth(nextDate.getMonth() + 3)
      break
    case 'YEARLY':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
    case 'PER_BILLING_CYCLE':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    default:
      nextDate.setMonth(nextDate.getMonth() + 1)
  }
  
  return nextDate
}

interface EnrollMemberData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  emergencyContactName?: string
  emergencyContactPhone?: string
  planId: string
  startDate: string
  durationDays: number
  couponCode?: string
}

/**
 * Complete member enrollment workflow:
 * 1. Creates a new Member record
 * 2. Creates an active MemberMembership
 * 3. Generates an Invoice with PAID status
 * 4. Applies coupon if provided
 * 5. Creates audit trail
 * 
 * Enforces:
 * - Branch scoping (member.branchId = context.branchId)
 * - RBAC (members.create permission)
 * - Transaction safety (all-or-nothing)
 */
export async function enrollMember(data: EnrollMemberData) {
  const context = await requirePermission('members.create')

  try {
    // Verify the plan exists and belongs to the branch/tenant
    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: data.planId,
        tenantId: context.tenantId,
        OR: [
          { branchId: context.branchId },
          { branchId: null } // Tenant-wide plans
        ]
      },
      include: {
        benefits: true // Include benefit definitions for balance initialization
      }
    })

    if (!plan) {
      return { success: false, error: 'Invalid membership plan selected' }
    }

    // Validate coupon if provided
    let coupon = null
    let discount = 0
    if (data.couponCode) {
      coupon = await prisma.coupon.findFirst({
        where: {
          code: data.couponCode.toUpperCase(),
          status: 'ACTIVE',
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
          tenantId: context.tenantId,
          OR: [
            { branchId: context.branchId },
            { branchId: null }
          ]
        }
      })

      if (!coupon) {
        return { success: false, error: 'Invalid or expired coupon code' }
      }

      // Check usage limits
      if (coupon.maxUsageCount !== null && coupon.currentUsageCount >= coupon.maxUsageCount) {
        return { success: false, error: 'Coupon usage limit exceeded' }
      }

      // Check if coupon applies to selected plan
      if (coupon.applicablePlanIds && coupon.applicablePlanIds.length > 0) {
        const planIds = coupon.applicablePlanIds as string[]
        if (!planIds.includes(plan.id)) {
          return { success: false, error: 'Coupon not applicable to selected plan' }
        }
      }

      // Check minimum purchase amount
      if (coupon.minPurchaseAmount && Number(plan.price) < Number(coupon.minPurchaseAmount)) {
        return { success: false, error: `Minimum purchase amount of $${coupon.minPurchaseAmount} required` }
      }

      // Calculate discount
      if (coupon.discountType === 'PERCENTAGE') {
        discount = Number(plan.price) * (Number(coupon.discountValue) / 100)
      } else if (coupon.discountType === 'FLAT_AMOUNT') {
        discount = Number(coupon.discountValue)
      }
    }

    const subtotal = Number(plan.price) + Number(plan.setupFee || 0)
    const totalAmount = Math.max(0, subtotal - discount)

    // Execute transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Member
      const member = await tx.member.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender || null,
          emergencyContact: data.emergencyContactName || null,
          emergencyPhone: data.emergencyContactPhone || null,
          referralCode: ReferralCodeGenerator.generateMemberCode(data.email),
          membershipId: `MEM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          branchId: context.branchId || null,
          tenantId: context.tenantId,
          status: 'ACTIVE'
        }
      })

      // 2. Create MemberMembership
      const startDate = new Date(data.startDate)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + data.durationDays)

      const membership = await tx.memberMembership.create({
        data: {
          memberId: member.id,
          planId: plan.id,
          branchId: context.branchId || null,
          startDate,
          endDate,
          status: 'ACTIVE'
        }
      })

      // 3. Generate Invoice Number
      const invoiceCount = await tx.invoice.count({
        where: { tenantId: context.tenantId }
      })
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`

      // 4. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          tenantId: context.tenantId,
          branchId: context.branchId || null,
          memberId: member.id,
          membershipId: membership.id,
          customerName: `${member.firstName} ${member.lastName}`,
          customerEmail: member.email || undefined,
          customerPhone: member.phone,
          issueDate: new Date(),
          dueDate: startDate,
          subtotal,
          discountAmount: discount,
          totalAmount,
          paidAmount: totalAmount,
          balanceAmount: 0,
          taxAmount: 0,
          status: 'PAID',
          items: {
            create: [
              {
                description: `${plan.name} - ${data.durationDays} days`,
                quantity: 1,
                unitPrice: plan.price,
                taxRate: 0,
                discount: 0,
                totalAmount: plan.price
              },
              ...(Number(plan.setupFee) > 0 ? [{
                description: 'Setup Fee',
                quantity: 1,
                unitPrice: plan.setupFee,
                taxRate: 0,
                discount: 0,
                totalAmount: plan.setupFee
              }] : [])
            ]
          }
        }
      })

      // 5. Record coupon usage if applied (with concurrent safety via conditional update)
      if (coupon) {
        // Use Prisma conditional update for atomic increment with limit check (prevents race conditions)
        const updateResult = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            OR: [
              { maxUsageCount: null },
              { currentUsageCount: { lt: coupon.maxUsageCount || 0 } }
            ]
          },
          data: {
            currentUsageCount: { increment: 1 }
          }
        })

        if (updateResult.count === 0) {
          throw new Error('Coupon usage limit exceeded or coupon no longer exists')
        }

        await tx.couponUsage.create({
          data: {
            couponId: coupon.id,
            memberId: member.id,
            invoiceId: invoice.id,
            discountApplied: discount,
            tenantId: context.tenantId,
            branchId: context.branchId || null
          }
        })
      }

      // 6. Initialize benefit balances
      for (const benefit of plan.benefits) {
        // Null guards for nullable fields
        const accrualQty = benefit.accrualQuantity ?? 0
        const initialBalance = benefit.maxBalance ? accrualQty : accrualQty
        const expiryDate = benefit.expiryDays 
          ? new Date(startDate.getTime() + (benefit.expiryDays ?? 0) * 24 * 60 * 60 * 1000) 
          : null
        
        // Calculate next accrual date only if accrualType is set and not ONE_TIME
        let nextAccrualDate = null
        if (benefit.accrualType && benefit.accrualType !== 'ONE_TIME') {
          nextAccrualDate = calculateNextAccrual(startDate, benefit.accrualType)
        }
        
        await tx.memberBenefitBalance.create({
          data: {
            memberId: member.id,
            benefitId: benefit.id,
            currentBalance: initialBalance,
            totalAccrued: initialBalance,
            totalConsumed: 0,
            lastAccrualDate: startDate,
            nextAccrualDate,
            expiryDate,
            tenantId: context.tenantId,
            branchId: context.branchId || null
          }
        })
      }

      // Audit logging inside transaction to ensure atomicity
      await tx.auditLog.create({
        data: {
          userId: context.userId,
          tenantId: context.tenantId,
          branchId: context.branchId || null,
          resource: 'Member',
          resourceId: member.id,
          action: 'CREATE',
          oldValues: null,
          newValues: {
            memberName: `${member.firstName} ${member.lastName}`,
            email: member.email,
            plan: plan.name,
            invoiceNumber: invoice.invoiceNumber,
            totalAmount
          }
        }
      })

      return { member, membership, invoice }
    })

    // Revalidate paths after successful transaction
    revalidatePath('/apps/members')
    revalidatePath('/apps/invoices')

    return {
      success: true,
      member: result.member,
      membership: result.membership,
      invoice: result.invoice
    }
  } catch (error) {
    console.error('Error enrolling member:', error)
    return { success: false, error: 'Failed to enroll member. Please try again.' }
  }
}
