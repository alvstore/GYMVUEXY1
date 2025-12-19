'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'

export async function calculatePayroll(data: {
  userId: string
  month: number
  year: number
  baseSalary: number
  bonuses?: number
  deductions?: number
  workingDays?: number
  presentDays?: number
}) {
  const context = await requirePermission('payroll.create')

  const baseSalary = data.baseSalary
  const bonuses = data.bonuses || 0
  const deductions = data.deductions || 0
  
  const workingDays = data.workingDays || 26
  const presentDays = data.presentDays || workingDays
  const dailySalary = baseSalary / workingDays
  const earnedSalary = dailySalary * presentDays

  const grossSalary = earnedSalary + bonuses
  const netSalary = grossSalary - deductions

  const payroll = await prisma.payroll.create({
    data: {
      tenantId: context.tenantId,
      branchId: context.branchId || '',
      userId: data.userId,
      month: data.month,
      year: data.year,
      baseSalary,
      bonuses,
      deductions,
      grossSalary,
      netSalary,
      workingDays,
      presentDays,
      status: 'pending',
      createdBy: context.userId,
    },
  })

  await AuditLogger.logCreate(
    context.userId,
    context.tenantId,
    'Payroll',
    payroll.id,
    payroll as any
  )

  return payroll
}

export async function getPayrolls(filters?: {
  userId?: string
  month?: number
  year?: number
  status?: string
  page?: number
  limit?: number
}) {
  const context = await requirePermission('payroll.view')

  const page = filters?.page || 1
  const limit = filters?.limit || 20
  const skip = (page - 1) * limit

  const where: any = {
    tenantId: context.tenantId,
    ...(context.branchId && { branchId: context.branchId }),
    ...(filters?.userId && { userId: filters.userId }),
    ...(filters?.month && { month: filters.month }),
    ...(filters?.year && { year: filters.year }),
    ...(filters?.status && { status: filters.status }),
  }

  const [payrolls, total] = await Promise.all([
    prisma.payroll.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.payroll.count({ where }),
  ])

  return { payrolls, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function approvePayroll(id: string) {
  const context = await requirePermission('payroll.approve')

  const payroll = await prisma.payroll.findFirst({
    where: { id, tenantId: context.tenantId, status: 'pending' },
  })

  if (!payroll) throw new Error('Payroll not found or already processed')

  const updated = await prisma.payroll.update({
    where: {
      id,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    data: { status: 'approved', approvedBy: context.userId, approvedAt: new Date() },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    action: 'APPROVE',
    entity: 'Payroll',
    entityId: id,
  })

  return updated
}

export async function generatePayslip(id: string) {
  const context = await requirePermission('payroll.view')

  const payroll = await prisma.payroll.findFirst({
    where: { id, tenantId: context.tenantId },
    include: {
      user: true,
      branch: true,
    },
  })

  if (!payroll) throw new Error('Payroll not found')

  return {
    payroll,
    employee: payroll.user,
    branch: payroll.branch,
    earnings: [
      { description: 'Base Salary', amount: payroll.baseSalary },
      { description: 'Bonuses', amount: payroll.bonuses },
    ],
    deductions: [
      { description: 'Deductions', amount: payroll.deductions },
    ],
    grossSalary: payroll.grossSalary,
    netSalary: payroll.netSalary,
    paymentDate: payroll.paidAt || new Date(),
  }
}
