import { prisma } from '@/lib/prisma'
import { Payroll, PayrollStatus } from '@prisma/client'

export interface CreatePayrollData {
  tenantId: string
  branchId: string
  userId: string
  payrollMonth: string // YYYY-MM
  basicSalary: number
  allowances?: number
  deductions?: number
  bonusAmount?: number
  notes?: string
}

export interface PayrollCalculation {
  workingDays: number
  presentDays: number
  leavesTaken: number
  overtimeHours: number
  overtimeRate: number
  grossSalary: number
  taxDeduction: number
  netSalary: number
}

export class PayrollService {
  static async calculatePayroll(userId: string, branchId: string, month: string): Promise<PayrollCalculation> {
    // Get user's basic salary from their profile or role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: {
          include: { role: true },
        },
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Calculate working days for the month
    const [year, monthNum] = month.split('-').map(Number)
    const daysInMonth = new Date(year, monthNum, 0).getDate()
    const workingDays = this.calculateWorkingDays(year, monthNum - 1)

    // Get attendance for the month
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0, 23, 59, 59)

    const attendance = await prisma.staffAttendance.findMany({
      where: {
        userId,
        branchId,
        checkInTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const presentDays = attendance.length
    const leavesTaken = workingDays - presentDays

    // Calculate overtime hours
    const overtimeHours = attendance.reduce((total, record) => {
      if (record.duration && record.duration > 480) { // More than 8 hours
        return total + Math.floor((record.duration - 480) / 60)
      }
      return total
    }, 0)

    // Get salary configuration (mock for now - would be from user profile or role)
    const basicSalary = this.getBasicSalary(user.roleAssignments[0]?.role?.name || 'staff')
    const overtimeRate = basicSalary / (workingDays * 8) * 1.5 // 1.5x hourly rate

    const grossSalary = basicSalary + (overtimeHours * overtimeRate)
    const taxDeduction = this.calculateTax(grossSalary)
    const netSalary = grossSalary - taxDeduction

    return {
      workingDays,
      presentDays,
      leavesTaken,
      overtimeHours,
      overtimeRate,
      grossSalary,
      taxDeduction,
      netSalary,
    }
  }

  static async createPayroll(data: CreatePayrollData): Promise<Payroll> {
    const calculation = await this.calculatePayroll(data.userId, data.branchId, data.payrollMonth)

    return await prisma.payroll.create({
      data: {
        ...data,
        allowances: data.allowances || 0,
        deductions: data.deductions || 0,
        bonusAmount: data.bonusAmount || 0,
        ...calculation,
        status: 'DRAFT',
      },
    })
  }

  static async approvePayroll(payrollId: string): Promise<Payroll> {
    return await prisma.payroll.update({
      where: { id: payrollId },
      data: { status: 'APPROVED' },
    })
  }

  static async processPayroll(payrollId: string): Promise<Payroll> {
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { user: true },
    })

    if (!payroll) {
      throw new Error('Payroll not found')
    }

    if (payroll.status !== 'APPROVED') {
      throw new Error('Payroll must be approved before processing')
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update payroll status
      const updatedPayroll = await tx.payroll.update({
        where: { id: payrollId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      })

      // Create transaction record
      await tx.transaction.create({
        data: {
          tenantId: payroll.tenantId,
          branchId: payroll.branchId,
          userId: payroll.userId,
          transactionType: 'SALARY',
          paymentMethod: 'BANK_TRANSFER',
          amount: payroll.netSalary,
          status: 'COMPLETED',
          notes: `Salary payment for ${payroll.payrollMonth} - ${payroll.user.name}`,
        },
      })

      return updatedPayroll
    })

    return result
  }

  static async getPayrolls(branchId?: string, month?: string, status?: PayrollStatus) {
    const where: any = {}

    if (branchId) where.branchId = branchId
    if (month) where.payrollMonth = month
    if (status) where.status = status

    return await prisma.payroll.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { payrollMonth: 'desc' },
        { user: { name: 'asc' } },
      ],
    })
  }

  static async getPayrollSummary(branchId?: string, month?: string) {
    const where: any = {}
    if (branchId) where.branchId = branchId
    if (month) where.payrollMonth = month

    const [
      totalPayrolls,
      approvedPayrolls,
      paidPayrolls,
      totalGrossSalary,
      totalNetSalary,
    ] = await Promise.all([
      prisma.payroll.count({ where }),
      prisma.payroll.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.payroll.count({ where: { ...where, status: 'PAID' } }),
      prisma.payroll.aggregate({
        where,
        _sum: { grossSalary: true },
      }),
      prisma.payroll.aggregate({
        where,
        _sum: { netSalary: true },
      }),
    ])

    return {
      totalPayrolls,
      approvedPayrolls,
      paidPayrolls,
      totalGrossSalary: Number(totalGrossSalary._sum.grossSalary || 0),
      totalNetSalary: Number(totalNetSalary._sum.netSalary || 0),
    }
  }

  private static calculateWorkingDays(year: number, month: number): number {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    let workingDays = 0

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayOfWeek = date.getDay()
      // Exclude Sundays (0) - adjust based on business requirements
      if (dayOfWeek !== 0) {
        workingDays++
      }
    }

    return workingDays
  }

  private static getBasicSalary(role: string): number {
    // Mock salary structure - would be configurable per tenant/branch
    const salaryStructure: Record<string, number> = {
      manager: 50000,
      trainer: 25000,
      staff: 18000,
      admin: 40000,
      super_admin: 75000,
    }

    return salaryStructure[role] || 18000
  }

  private static calculateTax(grossSalary: number): number {
    // Simplified tax calculation - would integrate with actual tax rules
    if (grossSalary <= 20000) return 0
    if (grossSalary <= 50000) return grossSalary * 0.05
    return grossSalary * 0.1
  }
}