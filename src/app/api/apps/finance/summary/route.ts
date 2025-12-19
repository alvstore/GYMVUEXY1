import { NextRequest, NextResponse } from 'next/server'
import { FinanceService } from '@/lib/services/financeService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'finance.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    const summary = await FinanceService.getFinancialSummary(tenantId, branchId, startDate, endDate)

    return NextResponse.json(summary)
  } catch (error: any) {
    console.error('Get financial summary error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch financial summary' },
      { status: 500 }
    )
  }
}