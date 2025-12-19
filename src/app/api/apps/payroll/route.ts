import { NextRequest, NextResponse } from 'next/server'
import { PayrollService } from '@/lib/services/payrollService'
import { RBACService } from '@/lib/rbac'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'payroll.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || undefined
    const month = searchParams.get('month') || undefined
    const status = searchParams.get('status') || undefined

    const payrolls = await PayrollService.getPayrolls(branchId, month, status as any)

    return NextResponse.json(payrolls)
  } catch (error: any) {
    console.error('Get payrolls error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payrolls' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'payroll.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      branchId,
      userId: employeeId,
      payrollMonth,
      basicSalary,
      allowances,
      deductions,
      bonusAmount,
      notes,
    } = body

    // Validate required fields
    if (!branchId || !employeeId || !payrollMonth || !basicSalary) {
      return NextResponse.json(
        { error: 'Branch ID, user ID, payroll month, and basic salary are required' },
        { status: 400 }
      )
    }

    const payroll = await PayrollService.createPayroll({
      tenantId,
      branchId,
      userId: employeeId,
      payrollMonth,
      basicSalary: parseFloat(basicSalary),
      allowances: allowances ? parseFloat(allowances) : undefined,
      deductions: deductions ? parseFloat(deductions) : undefined,
      bonusAmount: bonusAmount ? parseFloat(bonusAmount) : undefined,
      notes,
    })

    return NextResponse.json(payroll, { status: 201 })
  } catch (error: any) {
    console.error('Create payroll error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payroll' },
      { status: 500 }
    )
  }
}