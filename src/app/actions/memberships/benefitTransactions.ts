'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'

export async function consumeBenefit(data: {
  memberId: string
  benefitType: string
  quantity: number
  notes?: string
}) {
  const context = await requirePermission('members.consume_benefit')

  const balance = await prisma.memberBenefitBalance.findFirst({
    where: {
      memberId: data.memberId,
      benefitType: data.benefitType,
      tenantId: context.tenantId,
    },
  })

  if (!balance) throw new Error('Benefit not found')

  if (!balance.isUnlimited && balance.remainingBalance < data.quantity) {
    throw new Error('Insufficient benefit balance')
  }

  const transaction = await prisma.benefitTransaction.create({
    data: {
      tenantId: context.tenantId,
      branchId: balance.branchId,
      memberId: data.memberId,
      balanceId: balance.id,
      transactionType: 'CONSUMED',
      benefitType: data.benefitType,
      quantity: data.quantity,
      balanceBefore: balance.remainingBalance,
      balanceAfter: balance.isUnlimited ? balance.remainingBalance : balance.remainingBalance - data.quantity,
      notes: data.notes,
      performedBy: context.userId,
    },
  })

  if (!balance.isUnlimited) {
    await prisma.memberBenefitBalance.update({
      where: { id: balance.id },
      data: {
        usedBalance: { increment: data.quantity },
        remainingBalance: { decrement: data.quantity },
      },
    })
  }

  return transaction
}

export async function accrueBenefit(data: {
  memberId: string
  benefitType: string
  quantity: number
  reason: string
  notes?: string
}) {
  const context = await requirePermission('members.accrue_benefit')

  const balance = await prisma.memberBenefitBalance.findFirst({
    where: {
      memberId: data.memberId,
      benefitType: data.benefitType,
      tenantId: context.tenantId,
    },
  })

  if (!balance) throw new Error('Benefit not found')

  const transaction = await prisma.benefitTransaction.create({
    data: {
      tenantId: context.tenantId,
      branchId: balance.branchId,
      memberId: data.memberId,
      balanceId: balance.id,
      transactionType: 'ACCRUED',
      benefitType: data.benefitType,
      quantity: data.quantity,
      balanceBefore: balance.remainingBalance,
      balanceAfter: balance.remainingBalance + data.quantity,
      reason: data.reason,
      notes: data.notes,
      performedBy: context.userId,
    },
  })

  if (!balance.isUnlimited) {
    await prisma.memberBenefitBalance.update({
      where: { id: balance.id },
      data: {
        totalBalance: { increment: data.quantity },
        remainingBalance: { increment: data.quantity },
      },
    })
  }

  return transaction
}

export async function getBenefitTransactions(memberId: string, filters?: {
  benefitType?: string
  startDate?: Date
  endDate?: Date
}) {
  const context = await requirePermission('members.view')

  const transactions = await prisma.benefitTransaction.findMany({
    where: {
      memberId,
      tenantId: context.tenantId,
      ...(filters?.benefitType && { benefitType: filters.benefitType }),
      ...(filters?.startDate && { createdAt: { gte: filters.startDate } }),
      ...(filters?.endDate && { createdAt: { lte: filters.endDate } }),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return transactions
}
