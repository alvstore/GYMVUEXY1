import { NextRequest, NextResponse } from 'next/server'
import { EnhancedFinanceService } from '@/lib/services/enhancedFinanceService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'expenses.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || undefined
    const categoryId = searchParams.get('categoryId') || undefined
    const isApproved = searchParams.get('isApproved') === 'true' ? true : 
                      searchParams.get('isApproved') === 'false' ? false : undefined

    const expenses = await EnhancedFinanceService.getExpenses(tenantId, branchId, categoryId, isApproved)

    return NextResponse.json(expenses)
  } catch (error: any) {
    console.error('Get expenses error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch expenses' },
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'expenses.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      branchId,
      categoryId,
      description,
      amount,
      expenseDate,
      paymentMethod,
      vendorName,
      vendorGstin,
      billNumber,
      billImageUrl,
      taxAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      notes,
    } = body

    // Validate required fields
    if (!branchId || !categoryId || !description || !amount || !expenseDate || !paymentMethod) {
      return NextResponse.json(
        { error: 'Branch ID, category ID, description, amount, expense date, and payment method are required' },
        { status: 400 }
      )
    }

    const expense = await EnhancedFinanceService.createExpense({
      tenantId,
      branchId,
      categoryId,
      description,
      amount: parseFloat(amount),
      expenseDate: new Date(expenseDate),
      paymentMethod,
      vendorName,
      vendorGstin,
      billNumber,
      billImageUrl,
      taxAmount: taxAmount ? parseFloat(taxAmount) : undefined,
      cgstAmount: cgstAmount ? parseFloat(cgstAmount) : undefined,
      sgstAmount: sgstAmount ? parseFloat(sgstAmount) : undefined,
      igstAmount: igstAmount ? parseFloat(igstAmount) : undefined,
      notes,
      createdBy: userId,
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error: any) {
    console.error('Create expense error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create expense' },
      { status: 500 }
    )
  }
}