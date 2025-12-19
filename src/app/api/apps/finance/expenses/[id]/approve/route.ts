import { NextRequest, NextResponse } from 'next/server'
import { EnhancedFinanceService } from '@/lib/services/enhancedFinanceService'
import { RBACService } from '@/lib/rbac'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'expenses.approve')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const expense = await EnhancedFinanceService.approveExpense(id, userId)

    return NextResponse.json(expense)
  } catch (error: any) {
    console.error('Approve expense error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve expense' },
      { status: 500 }
    )
  }
}